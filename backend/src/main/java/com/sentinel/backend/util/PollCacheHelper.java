package com.sentinel.backend.util;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.cache.RedisCacheService.UserPollEntry;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.sse.dto.PollSsePayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.sentinel.backend.constant.CacheKeys.POLL;
import static com.sentinel.backend.constant.CacheKeys.USER_POLLS;
import static com.sentinel.backend.constant.Constants.ACTIVE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollCacheHelper {

    private final RedisCacheService cache;

    public void savePollToCache(Signal signal, Poll poll) {
        long start = System.currentTimeMillis();
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
        pollData.put("showIndividualResponses", signal.getShowIndividualResponses());
        pollData.put("selectionType", poll.getSelectionType());
        pollData.put("maxSelections", poll.getMaxSelections());

        List<UserPollEntry> userPollEntries = new ArrayList<>(signal.getSharedWith().length);
        double score = signal.getCreatedOn().toEpochMilli();
        for (String userEmail : signal.getSharedWith()) {
            String userKey = cache.buildKey(USER_POLLS, userEmail);
            userPollEntries.add(new UserPollEntry(userKey, signal.getId(), score));
        }

        cache.pipelinedPollCreate(pollKey, pollData, cache.getPollTtl(), userPollEntries);

        log.info("[POLL][CACHE_WRITE][PIPELINED] signalId={} | recipientCount={} | durationMs={}",
                signal.getId(), signal.getSharedWith().length, System.currentTimeMillis() - start);
    }

    public void savePollToCacheSequential(Signal signal, Poll poll) {
        long start = System.currentTimeMillis();
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
        pollData.put("showIndividualResponses", signal.getShowIndividualResponses());
        pollData.put("selectionType", poll.getSelectionType());
        pollData.put("maxSelections", poll.getMaxSelections());

        cache.hSetAll(pollKey, pollData, cache.getPollTtl());

        for (String userEmail : signal.getSharedWith()) {
            String userKey = cache.buildKey(USER_POLLS, userEmail);
            cache.addToSortedSet(userKey, signal.getId(),
                    signal.getCreatedOn().toEpochMilli(), cache.getPollTtl());
        }

        log.info("[POLL][CACHE_WRITE][SEQUENTIAL] signalId={} | recipientCount={} | durationMs={}",
                signal.getId(), signal.getSharedWith().length, System.currentTimeMillis() - start);
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
        signal.setShowIndividualResponses(scheduledPoll.getShowIndividualResponses());
        return signal;
    }

    public Poll buildPollFromScheduledPoll(ScheduledPoll scheduledPoll, Signal signal) {
        Poll poll = new Poll();
        poll.setSignalId(scheduledPoll.getReservedSignalId());
        poll.setSignal(signal);
        poll.setQuestion(scheduledPoll.getQuestion());
        poll.setOptions(scheduledPoll.getOptions());
        poll.setSelectionType(scheduledPoll.getSelectionType());
        poll.setMaxSelections(scheduledPoll.getMaxSelections());
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
                .showIndividualResponses(signal.getShowIndividualResponses())
                .selectionType(poll.getSelectionType())
                .maxSelections(poll.getMaxSelections())
                .build();
    }
}
