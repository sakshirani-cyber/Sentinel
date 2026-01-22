package com.sentinel.backend.service;

import com.sentinel.backend.cache.AsyncDbSyncService;
import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.ScheduledPollRepository;
import com.sentinel.backend.repository.SignalRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import com.sentinel.backend.sse.dto.PollSsePayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static com.sentinel.backend.constant.Constants.ACTIVE;
import static com.sentinel.backend.constant.Constants.POLL;
import static com.sentinel.backend.constant.Constants.POLL_CREATED;

@Service
@RequiredArgsConstructor
@Slf4j
public class PollSchedulerService {

    private final TaskScheduler taskScheduler;
    private final ScheduledPollRepository scheduledPollRepository;
    private final PollSsePublisher pollSsePublisher;
    private final RedissonClient redissonClient;
    private final RedisCacheService cache;
    private final AsyncDbSyncService asyncDbSync;

    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeScheduler() {
        log.info("[SCHEDULER][INIT] Initializing poll scheduler on startup...");

        try {
            List<ScheduledPoll> pendingPolls = scheduledPollRepository
                    .findAllPendingSchedules(Instant.now());

            log.info("[SCHEDULER][INIT] Found {} pending scheduled polls", pendingPolls.size());

            for (ScheduledPoll sp : pendingPolls) {
                scheduleTask(sp);
            }

            log.info("[SCHEDULER][INIT] Initialization complete | scheduled={}", pendingPolls.size());

        } catch (Exception e) {
            log.error("[SCHEDULER][INIT][ERROR] Failed to initialize scheduler", e);
        }
    }

    public void scheduleTask(ScheduledPoll scheduledPoll) {

        if (scheduledTasks.containsKey(scheduledPoll.getId())) {
            log.warn("[SCHEDULER][SCHEDULE] Task already scheduled in this instance | pollId={}",
                    scheduledPoll.getId());
            return;
        }

        try {
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> publishScheduledPoll(scheduledPoll.getId()),
                    scheduledPoll.getScheduledTime()
            );

            scheduledTasks.put(scheduledPoll.getId(), future);

            log.info("[SCHEDULER][SCHEDULE] Task scheduled | pollId={} | scheduledTime={} | " +
                            "timeUntilExecution={}s",
                    scheduledPoll.getId(),
                    scheduledPoll.getScheduledTime(),
                    java.time.Duration.between(Instant.now(), scheduledPoll.getScheduledTime()).getSeconds());

        } catch (Exception e) {
            log.error("[SCHEDULER][SCHEDULE][ERROR] Failed to schedule task | pollId={}",
                    scheduledPoll.getId(), e);
        }
    }

    public void cancelTask(Long scheduledPollId) {
        ScheduledFuture<?> future = scheduledTasks.remove(scheduledPollId);

        if (future != null && !future.isDone()) {
            boolean cancelled = future.cancel(false);
            log.info("[SCHEDULER][CANCEL] Task cancelled | pollId={} | cancelled={}",
                    scheduledPollId, cancelled);
        } else {
            log.debug("[SCHEDULER][CANCEL] No active task found | pollId={}", scheduledPollId);
        }
    }

    public void rescheduleTask(ScheduledPoll scheduledPoll) {
        log.info("[SCHEDULER][RESCHEDULE] Rescheduling task | pollId={} | newTime={}",
                scheduledPoll.getId(), scheduledPoll.getScheduledTime());

        cancelTask(scheduledPoll.getId());
        scheduleTask(scheduledPoll);
    }

    @Transactional
    public void publishScheduledPoll(Long scheduledPollId) {

        String lockKey = "lock:scheduled:publish:" + scheduledPollId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            boolean acquired = lock.tryLock(1, 30, TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("[SCHEDULER][PUBLISH] Could not acquire lock, likely published by another instance | pollId={}",
                        scheduledPollId);
                scheduledTasks.remove(scheduledPollId);
                return;
            }

            log.info("[SCHEDULER][PUBLISH] Lock acquired, publishing scheduled poll | pollId={}",
                    scheduledPollId);

            ScheduledPoll sp = scheduledPollRepository.findById(scheduledPollId).orElse(null);

            if (sp == null) {
                log.warn("[SCHEDULER][PUBLISH] Scheduled poll not found (may have been deleted) | pollId={}",
                        scheduledPollId);
                scheduledTasks.remove(scheduledPollId);
                return;
            }

            Signal signal = buildSignal(sp);
            signal.setId(sp.getReservedSignalId());
            signal.setCreatedOn(Instant.now());

            Poll poll = new Poll();
            poll.setSignalId(sp.getReservedSignalId());
            poll.setSignal(signal);
            poll.setQuestion(sp.getQuestion());
            poll.setOptions(sp.getOptions());

            savePollToCache(signal, poll);

            asyncDbSync.asyncSaveSignal(signal);
            asyncDbSync.asyncSavePoll(poll);

            PollSsePayload payload = buildPollSsePayload(signal, poll);
            payload.setRepublish(false);

            pollSsePublisher.publish(
                    signal.getSharedWith(),
                    POLL_CREATED,
                    payload
            );

            scheduledPollRepository.deleteById(scheduledPollId);

            String cacheKey = cache.buildKey("scheduled_poll", sp.getReservedSignalId().toString());
            cache.delete(cacheKey);

            scheduledTasks.remove(scheduledPollId);

            log.info("[SCHEDULER][PUBLISH] Successfully published scheduled poll | " +
                            "scheduledPollId={} | signalId={} | recipients={}",
                    scheduledPollId, signal.getId(), signal.getSharedWith().length);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[SCHEDULER][PUBLISH][ERROR] Interrupted while acquiring lock | pollId={}",
                    scheduledPollId, e);
            scheduledTasks.remove(scheduledPollId);

        } catch (Exception e) {
            log.error("[SCHEDULER][PUBLISH][ERROR] Failed to publish scheduled poll | pollId={}",
                    scheduledPollId, e);
            scheduledTasks.remove(scheduledPollId);

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("[SCHEDULER][PUBLISH] Lock released | pollId={}", scheduledPollId);
            }
        }
    }

    private Signal buildSignal(ScheduledPoll sp) {
        Signal s = new Signal();
        s.setCreatedBy(sp.getCreatedBy());
        s.setAnonymous(sp.getAnonymous());
        s.setTypeOfSignal(POLL);
        s.setSharedWith(sp.getSharedWith());
        s.setDefaultFlag(sp.getDefaultFlag());
        s.setDefaultOption(sp.getDefaultOption());
        s.setEndTimestamp(sp.getEndTimestamp());
        s.setStatus(ACTIVE);
        s.setPersistentAlert(sp.getPersistentAlert());
        s.setLabels(sp.getLabels());
        return s;
    }

    private PollSsePayload buildPollSsePayload(Signal signal, Poll poll) {
        return PollSsePayload.builder()
                .signalId(signal.getId())
                .question(poll.getQuestion())
                .options(poll.getOptions())
                .endTimestamp(signal.getEndTimestamp())
                .anonymous(signal.getAnonymous())
                .defaultFlag(signal.getDefaultFlag())
                .defaultOption(signal.getDefaultOption())
                .persistentAlert(signal.getPersistentAlert())
                .createdBy(signal.getCreatedBy())
                .sharedWith(signal.getSharedWith())
                .labels(signal.getLabels())
                .build();
    }

    private void savePollToCache(Signal signal, Poll poll) {
        String pollKey = cache.buildKey("poll", signal.getId().toString());

        Map<String, Object> pollData = new java.util.HashMap<>();
        pollData.put("signalId", signal.getId());
        pollData.put("question", poll.getQuestion());
        pollData.put("options", poll.getOptions());
        pollData.put("status", signal.getStatus());
        pollData.put("createdBy", signal.getCreatedBy());
        pollData.put("createdOn", signal.getCreatedOn());
        pollData.put("lastEdited", signal.getLastEdited());
        pollData.put("anonymous", signal.getAnonymous());
        pollData.put("endTimestamp", signal.getEndTimestamp());
        pollData.put("typeOfSignal", signal.getTypeOfSignal());
        pollData.put("defaultFlag", signal.getDefaultFlag());
        pollData.put("defaultOption", signal.getDefaultOption());
        pollData.put("sharedWith", signal.getSharedWith());
        pollData.put("persistentAlert", signal.getPersistentAlert());
        pollData.put("labels", signal.getLabels());
        pollData.put("lastEditedBy", signal.getLastEditedBy());

        cache.hSetAll(pollKey, pollData, cache.getPollTtl());

        for (String userEmail : signal.getSharedWith()) {
            String userKey = cache.buildKey("user:polls", userEmail);
            cache.addToSortedSet(userKey, signal.getId(),
                    signal.getCreatedOn().toEpochMilli(), cache.getPollTtl());
        }
    }

    public int getScheduledTaskCount() {
        return scheduledTasks.size();
    }
}