package com.sentinel.backend.util;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.sse.dto.PollSsePayload;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static com.sentinel.backend.constant.CacheKeys.POLL;
import static com.sentinel.backend.constant.CacheKeys.USER_POLLS;
import static com.sentinel.backend.constant.Constants.ACTIVE;

@Component
@RequiredArgsConstructor
public class PollCacheHelper {

    private final RedisCacheService cache;

    public void savePollToCache(Signal signal, Poll poll) {
        String pollKey = cache.buildKey(POLL, signal.getId().toString());

        Map<String, Object> pollData = new HashMap<>();
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
        pollData.put("title", signal.getTitle());

        cache.hSetAll(pollKey, pollData, cache.getPollTtl());

        for (String userEmail : signal.getSharedWith()) {
            String userKey = cache.buildKey(USER_POLLS, userEmail);
            cache.addToSortedSet(userKey, signal.getId(),
                    signal.getCreatedOn().toEpochMilli(), cache.getPollTtl());
        }
    }

    public Signal buildSignalFromScheduledPoll(ScheduledPoll scheduledPoll) {
        Signal signal = new Signal();
        signal.setId(scheduledPoll.getReservedSignalId());
        signal.setCreatedBy(scheduledPoll.getCreatedBy());
        signal.setAnonymous(scheduledPoll.getAnonymous());
        signal.setTypeOfSignal(com.sentinel.backend.constant.Constants.POLL);
        signal.setSharedWith(scheduledPoll.getSharedWith());
        signal.setDefaultFlag(scheduledPoll.getDefaultFlag());
        signal.setDefaultOption(scheduledPoll.getDefaultOption());
        signal.setEndTimestamp(scheduledPoll.getEndTimestamp());
        signal.setStatus(ACTIVE);
        signal.setPersistentAlert(scheduledPoll.getPersistentAlert());
        signal.setLabels(scheduledPoll.getLabels());
        signal.setCreatedOn(Instant.now());
        signal.setTitle(scheduledPoll.getTitle());
        return signal;
    }

    public Poll buildPollFromScheduledPoll(ScheduledPoll scheduledPoll, Signal signal) {
        Poll poll = new Poll();
        poll.setSignalId(scheduledPoll.getReservedSignalId());
        poll.setSignal(signal);
        poll.setQuestion(scheduledPoll.getQuestion());
        poll.setOptions(scheduledPoll.getOptions());
        return poll;
    }

    public PollSsePayload buildPollSsePayload(Signal signal, Poll poll, boolean republish) {
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
                .republish(republish)
                .title(signal.getTitle())
                .build();
    }
}
