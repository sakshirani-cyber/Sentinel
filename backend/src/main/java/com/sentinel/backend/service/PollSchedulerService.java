package com.sentinel.backend.service;

import com.sentinel.backend.cache.AsyncDbSyncService;
import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.repository.ScheduledPollRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import com.sentinel.backend.util.PollCacheHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static com.sentinel.backend.constant.CacheKeys.LOCK_SCHEDULED_PUBLISH_PREFIX;
import static com.sentinel.backend.constant.CacheKeys.SCHEDULED_POLL;
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
    private final PollCacheHelper pollCacheHelper;

    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeScheduler() {
        log.info("[SCHEDULER][INIT] Starting poll scheduler initialization");

        try {
            List<ScheduledPoll> pendingPolls = scheduledPollRepository.findAllPendingSchedules(Instant.now());

            log.info("[SCHEDULER][INIT] Found {} pending scheduled polls", pendingPolls.size());

            for (ScheduledPoll scheduledPoll : pendingPolls) {
                scheduleTask(scheduledPoll);
            }

            log.info("[SCHEDULER][INIT] Initialization complete | scheduledCount={}", pendingPolls.size());

        } catch (Exception e) {
            log.error("[SCHEDULER][INIT][ERROR] Failed to initialize scheduler | error={}", e.getMessage(), e);
        }
    }

    public void scheduleTask(ScheduledPoll scheduledPoll) {
        if (scheduledTasks.containsKey(scheduledPoll.getId())) {
            log.warn("[SCHEDULER][SCHEDULE] Task already scheduled | pollId={}", scheduledPoll.getId());
            return;
        }

        try {
            ScheduledFuture<?> future = taskScheduler.schedule(
                    () -> publishScheduledPoll(scheduledPoll.getId()),
                    scheduledPoll.getScheduledTime()
            );

            scheduledTasks.put(scheduledPoll.getId(), future);

            long secondsUntilExecution = Duration.between(Instant.now(), scheduledPoll.getScheduledTime()).getSeconds();
            log.info("[SCHEDULER][SCHEDULE] Task scheduled | pollId={} | scheduledTime={} | secondsUntilExecution={}",
                    scheduledPoll.getId(), scheduledPoll.getScheduledTime(), secondsUntilExecution);

        } catch (Exception e) {
            log.error("[SCHEDULER][SCHEDULE][ERROR] Failed to schedule task | pollId={} | error={}",
                    scheduledPoll.getId(), e.getMessage(), e);
        }
    }

    public void cancelTask(Long scheduledPollId) {
        ScheduledFuture<?> future = scheduledTasks.remove(scheduledPollId);

        if (future != null && !future.isDone()) {
            boolean cancelled = future.cancel(false);
            log.info("[SCHEDULER][CANCEL] Task cancelled | pollId={} | success={}", scheduledPollId, cancelled);
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
        String lockKey = LOCK_SCHEDULED_PUBLISH_PREFIX + scheduledPollId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            boolean acquired = lock.tryLock(1, 30, TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("[SCHEDULER][PUBLISH] Lock not acquired, likely published by another instance | pollId={}",
                        scheduledPollId);
                scheduledTasks.remove(scheduledPollId);
                return;
            }

            log.info("[SCHEDULER][PUBLISH] Lock acquired, publishing scheduled poll | pollId={}", scheduledPollId);

            ScheduledPoll scheduledPoll = scheduledPollRepository.findById(scheduledPollId).orElse(null);

            if (scheduledPoll == null) {
                log.warn("[SCHEDULER][PUBLISH] Scheduled poll not found (may have been deleted) | pollId={}",
                        scheduledPollId);
                scheduledTasks.remove(scheduledPollId);
                return;
            }

            Signal signal = pollCacheHelper.buildSignalFromScheduledPoll(scheduledPoll);
            Poll poll = pollCacheHelper.buildPollFromScheduledPoll(scheduledPoll, signal);

            pollCacheHelper.savePollToCache(signal, poll);

            asyncDbSync.asyncSaveSignalWithPoll(signal, poll);

            pollSsePublisher.publish(
                    signal.getSharedWith(),
                    POLL_CREATED,
                    pollCacheHelper.buildPollSsePayload(signal, poll, false)
            );

            scheduledPollRepository.deleteById(scheduledPollId);
            cache.delete(cache.buildKey(SCHEDULED_POLL, scheduledPoll.getReservedSignalId().toString()));
            scheduledTasks.remove(scheduledPollId);

            log.info("[SCHEDULER][PUBLISH] Successfully published scheduled poll | scheduledPollId={} | signalId={} | recipientCount={}",
                    scheduledPollId, signal.getId(), signal.getSharedWith().length);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[SCHEDULER][PUBLISH][ERROR] Interrupted while acquiring lock | pollId={}", scheduledPollId);
            scheduledTasks.remove(scheduledPollId);

        } catch (Exception e) {
            log.error("[SCHEDULER][PUBLISH][ERROR] Failed to publish scheduled poll | pollId={} | error={}",
                    scheduledPollId, e.getMessage(), e);
            scheduledTasks.remove(scheduledPollId);

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("[SCHEDULER][PUBLISH] Lock released | pollId={}", scheduledPollId);
            }
        }
    }
}