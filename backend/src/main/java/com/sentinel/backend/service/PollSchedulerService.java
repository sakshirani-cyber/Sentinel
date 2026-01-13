package com.sentinel.backend.service;

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

import static com.sentinel.backend.constant.Constants.ACTIVE;
import static com.sentinel.backend.constant.Constants.POLL;
import static com.sentinel.backend.constant.Constants.POLL_CREATED;

@Service
@RequiredArgsConstructor
@Slf4j
public class PollSchedulerService {

    private final TaskScheduler taskScheduler;
    private final ScheduledPollRepository scheduledPollRepository;
    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollSsePublisher pollSsePublisher;

    private final Map<Long, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeScheduler() {
        log.info("Initializing poll scheduler on startup...");
        List<ScheduledPoll> pendingPolls = scheduledPollRepository
                .findAllPendingSchedules(Instant.now());

        log.info("Found {} pending scheduled polls", pendingPolls.size());

        for (ScheduledPoll sp : pendingPolls) {
            scheduleTask(sp);
        }
    }

    public void scheduleTask(ScheduledPoll scheduledPoll) {
        if (scheduledTasks.containsKey(scheduledPoll.getId())) {
            log.warn("Task already scheduled for poll id: {}", scheduledPoll.getId());
            return;
        }

        ScheduledFuture<?> future = taskScheduler.schedule(
                () -> publishScheduledPoll(scheduledPoll.getId()),
                scheduledPoll.getScheduledTime()
        );

        scheduledTasks.put(scheduledPoll.getId(), future);
        log.info("Scheduled poll id: {} for time: {}",
                scheduledPoll.getId(), scheduledPoll.getScheduledTime());
    }

    public void cancelTask(Long scheduledPollId) {
        ScheduledFuture<?> future = scheduledTasks.remove(scheduledPollId);
        if (future != null && !future.isDone()) {
            future.cancel(false);
            log.info("Cancelled scheduled task for poll id: {}", scheduledPollId);
        }
    }

    public void rescheduleTask(ScheduledPoll scheduledPoll) {
        cancelTask(scheduledPoll.getId());
        scheduleTask(scheduledPoll);
    }

    @Transactional
    public void publishScheduledPoll(Long scheduledPollId) {
        try {
            log.info("Publishing scheduled poll id: {}", scheduledPollId);

            ScheduledPoll sp = scheduledPollRepository.findById(scheduledPollId)
                    .orElse(null);

            if (sp == null) {
                log.warn("Scheduled poll id: {} not found, may have been deleted",
                        scheduledPollId);
                scheduledTasks.remove(scheduledPollId);
                return;
            }

            Signal signal = buildSignal(sp);
            signal.setId(sp.getReservedSignalId());
            signalRepository.save(signal);

            Poll poll = new Poll();
            poll.setSignal(signal);
            poll.setQuestion(sp.getQuestion());
            poll.setOptions(sp.getOptions());
            pollRepository.save(poll);

            PollSsePayload payload = buildPollSsePayload(signal, poll);
            payload.setRepublish(false);

            pollSsePublisher.publish(
                    signal.getSharedWith(),
                    POLL_CREATED,
                    payload
            );

            scheduledPollRepository.deleteById(scheduledPollId);
            scheduledTasks.remove(scheduledPollId);

            log.info("Successfully published scheduled poll id: {} as signal id: {}",
                    scheduledPollId, signal.getId());

        } catch (Exception e) {
            log.error("Error publishing scheduled poll id: {}", scheduledPollId, e);
            scheduledTasks.remove(scheduledPollId);
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
}