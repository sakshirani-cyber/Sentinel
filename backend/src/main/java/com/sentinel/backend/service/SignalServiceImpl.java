package com.sentinel.backend.service;

import com.sentinel.backend.cache.AsyncDbSyncService;
import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.dto.helper.UserVoteDTO;
import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.request.PollEditDTO;
import com.sentinel.backend.dto.request.PollSubmitDTO;
import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.response.PollResultDTO;
import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.PollResultId;
import com.sentinel.backend.entity.ScheduledPoll;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.exception.CustomException;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.ScheduledPollRepository;
import com.sentinel.backend.repository.SignalRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import com.sentinel.backend.sse.dto.PollSsePayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static com.sentinel.backend.constant.Constants.ACTIVE;
import static com.sentinel.backend.constant.Constants.POLL;
import static com.sentinel.backend.constant.Constants.POLL_CREATED;
import static com.sentinel.backend.constant.Constants.POLL_DELETED;
import static com.sentinel.backend.constant.Constants.POLL_EDITED;
import static com.sentinel.backend.constant.Queries.GET_ROLE_BY_EMAIL_AND_PASSWORD;
import static org.springframework.util.StringUtils.hasText;

@Service
@RequiredArgsConstructor
@Slf4j
public class SignalServiceImpl implements SignalService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final ScheduledPollRepository scheduledPollRepository;
    private final JdbcTemplate jdbcTemplate;

    private final RedisCacheService cache;
    private final AsyncDbSyncService asyncDbSync;
    private final PollSsePublisher pollSsePublisher;
    private final PollSchedulerService pollSchedulerService;
    private final RedissonClient redissonClient;

    @Override
    public CreatePollResponse createPoll(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        String lockKey = "lock:signal:create";
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Long signalId = cache.incr("signal:id:counter");
            if (signalId == null) {
                signalId = signalRepository.getNextSignalId();
                cache.set("signal:id:counter", signalId.toString(), null);
            }

            Signal signal = buildSignal(dto);
            signal.setId(signalId);

            Poll poll = new Poll();
            poll.setSignalId(signalId);
            poll.setSignal(signal);
            poll.setQuestion(dto.getQuestion());
            poll.setOptions(dto.getOptions());

            savePollToCache(signal, poll);

            asyncDbSync.asyncSaveSignal(signal);
            asyncDbSync.asyncSavePoll(poll);

            publish(signal, poll, POLL_CREATED, false);

            log.info("[SIGNAL][CREATE] signalId={} | localId={} | users={}",
                    signalId, dto.getLocalId(), signal.getSharedWith().length);

            return new CreatePollResponse(signalId, dto.getLocalId());

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    @Transactional
    public CreatePollResponse createScheduledPoll(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        String lockKey = "lock:signal:create";
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Long reservedId = cache.incr("signal:id:counter");
            if (reservedId == null) {
                reservedId = signalRepository.getNextSignalId();
                cache.set("signal:id:counter", reservedId.toString(), null);
            }

            ScheduledPoll scheduledPoll = buildScheduledPoll(dto);
            scheduledPoll.setReservedSignalId(reservedId);

            scheduledPollRepository.save(scheduledPoll);

            String key = cache.buildKey("scheduled_poll", reservedId.toString());
            cache.set(key, scheduledPoll, cache.getPollTtl());

            pollSchedulerService.scheduleTask(scheduledPoll);

            log.info("[SIGNAL][SCHEDULED_CREATE] reservedId={} | scheduledTime={}",
                    reservedId, dto.getScheduledTime());

            return new CreatePollResponse(reservedId, dto.getLocalId());

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    public void submitOrUpdateVote(PollSubmitDTO dto) {
        dto.normalize();

        Long signalId = dto.getSignalId();
        String userEmail = dto.getUserEmail();

        String lockKey = "lock:vote:" + signalId + ":" + userEmail;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(2, TimeUnit.SECONDS);

            Signal signal = getActivePollSignalFromCache(signalId, userEmail);

            PollResultId id = new PollResultId(signalId, userEmail);
            PollResult result = new PollResult();
            result.setId(id);
            result.setSignal(signal);
            result.setSelectedOption(dto.getSelectedOption());
            result.setDefaultResponse(dto.getDefaultResponse());
            result.setReason(dto.getReason());
            result.setTimeOfSubmission(Instant.now());

            saveVoteToCache(result);

            String resultsCacheKey = cache.buildKey("cache:poll:results", signalId.toString());
            cache.delete(resultsCacheKey);

            asyncDbSync.asyncSavePollResult(result);

            log.info("[SIGNAL][VOTE] signalId={} | user={} | option={}",
                    signalId, userEmail, dto.getSelectedOption());

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    public PollResultDTO getPollResults(Long signalId) {

        String cacheKey = cache.buildKey("cache:poll:results", signalId.toString());
        PollResultDTO cached = cache.get(cacheKey, PollResultDTO.class);
        if (cached != null) {
            log.info("[SIGNAL][RESULTS][CACHE_HIT] signalId={}", signalId);
            return cached;
        }

        Signal signal = getPollSignalFromCache(signalId);
        Poll poll = getPollFromCache(signalId);
        List<PollResult> results = getVotesFromCache(signalId);

        PollResultDTO dto = buildPollResults(signal, poll, results);

        cache.set(cacheKey, dto, cache.getPollResultsTtl());

        log.info("[SIGNAL][RESULTS] signalId={} | responded={}/{}",
                signalId, dto.getTotalResponded(), dto.getTotalAssigned());

        return dto;
    }

    @Override
    public void editSignal(PollEditDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        Long signalId = dto.getSignalId();
        String lockKey = "lock:poll:edit:" + signalId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Signal signal = getEditablePollSignalFromCache(signalId);
            Poll poll = getPollFromCache(signalId);

            handleRepublishOrUnshare(dto, signal);

            poll.setQuestion(dto.getQuestion());
            poll.setOptions(dto.getOptions());

            signal.setAnonymous(dto.getAnonymous());
            signal.setDefaultFlag(dto.getDefaultFlag());
            signal.setDefaultOption(dto.getDefaultOption());
            signal.setSharedWith(dto.getSharedWith());
            signal.setLastEditedBy(dto.getLastEditedBy());
            signal.setLastEdited(Instant.now());
            signal.setEndTimestamp(dto.getEndTimestampUtc());
            signal.setPersistentAlert(dto.getPersistentAlert());
            signal.setLabels(dto.getLabels());

            savePollToCache(signal, poll);

            String resultsCacheKey = cache.buildKey("cache:poll:results", signalId.toString());
            cache.delete(resultsCacheKey);

            asyncDbSync.asyncUpdateSignal(signal);
            asyncDbSync.asyncUpdatePoll(poll);

            publish(signal, poll, POLL_EDITED, dto.getRepublish());

            log.info("[SIGNAL][EDIT] signalId={} | republish={}", signalId, dto.getRepublish());

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    @Transactional
    public void editScheduledSignal(PollEditDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        ScheduledPoll scheduledPoll = scheduledPollRepository
                .findByReservedSignalId(dto.getSignalId())
                .orElseThrow(() -> new CustomException(
                        "Scheduled poll not found",
                        HttpStatus.NOT_FOUND
                ));

        Instant oldScheduledTime = scheduledPoll.getScheduledTime();

        scheduledPoll.setQuestion(dto.getQuestion());
        scheduledPoll.setOptions(dto.getOptions());
        scheduledPoll.setAnonymous(dto.getAnonymous());
        scheduledPoll.setSharedWith(dto.getSharedWith());
        scheduledPoll.setDefaultFlag(dto.getDefaultFlag());
        scheduledPoll.setDefaultOption(dto.getDefaultOption());
        scheduledPoll.setScheduledTime(dto.getScheduledTime());
        scheduledPoll.setEndTimestamp(dto.getEndTimestampUtc());
        scheduledPoll.setPersistentAlert(dto.getPersistentAlert());
        scheduledPoll.setLabels(dto.getLabels());

        scheduledPollRepository.save(scheduledPoll);

        String key = cache.buildKey("scheduled_poll", dto.getSignalId().toString());
        cache.set(key, scheduledPoll, cache.getPollTtl());

        pollSchedulerService.rescheduleTask(scheduledPoll);

        log.info("[SIGNAL][SCHEDULED_EDIT] reservedId={}", dto.getSignalId());
    }

    @Override
    public void deleteSignal(Long signalId) {
        String lockKey = "lock:poll:delete:" + signalId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Signal signal = getPollSignalFromCache(signalId);

            cache.delete(cache.buildKey("poll", signalId.toString()));
            cache.delete(cache.buildKey("poll:results", signalId.toString()));
            cache.delete(cache.buildKey("cache:poll:results", signalId.toString()));

            asyncDbSync.asyncDeletePollResults(signalId);
            asyncDbSync.asyncDeletePoll(signalId);
            asyncDbSync.asyncDeleteSignal(signalId);

            pollSsePublisher.publish(signal.getSharedWith(), POLL_DELETED, signalId);

            log.info("[SIGNAL][DELETE] signalId={}", signalId);

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    @Transactional
    public void deleteScheduledSignal(Long signalId) {
        ScheduledPoll scheduledPoll = scheduledPollRepository
                .findByReservedSignalId(signalId)
                .orElseThrow(() -> new CustomException(
                        "Scheduled poll not found",
                        HttpStatus.NOT_FOUND
                ));

        pollSchedulerService.cancelTask(scheduledPoll.getId());
        scheduledPollRepository.delete(scheduledPoll);

        // Delete from cache
        cache.delete(cache.buildKey("scheduled_poll", signalId.toString()));

        log.info("[SIGNAL][SCHEDULED_DELETE] reservedId={}", signalId);
    }

    @Override
    public String login(String userEmail, String password) {
        try {
            return jdbcTemplate.queryForObject(
                    GET_ROLE_BY_EMAIL_AND_PASSWORD,
                    String.class,
                    userEmail,
                    password
            );
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private void savePollToCache(Signal signal, Poll poll) {
        String pollKey = cache.buildKey("poll", signal.getId().toString());

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

        cache.hSetAll(pollKey, pollData, cache.getPollTtl());

        for (String userEmail : signal.getSharedWith()) {
            String userKey = cache.buildKey("user:polls", userEmail);
            cache.addToSortedSet(userKey, signal.getId(),
                    signal.getCreatedOn().toEpochMilli(), cache.getPollTtl());
        }
    }

    private void saveVoteToCache(PollResult result) {
        String voteKey = cache.buildKey("poll:results",
                result.getId().getSignalId().toString());

        Map<String, Object> voteData = new HashMap<>();
        voteData.put("selectedOption", result.getSelectedOption());
        voteData.put("defaultResponse", result.getDefaultResponse());
        voteData.put("reason", result.getReason());
        voteData.put("timeOfSubmission", result.getTimeOfSubmission());

        cache.hSet(voteKey, result.getId().getUserEmail(), voteData);
    }

    private Signal getPollSignalFromCache(Long signalId) {
        String key = cache.buildKey("poll", signalId.toString());
        Map<String, Object> data = cache.hGetAll(key);

        if (data.isEmpty()) {
            return getPollSignalFromDB(signalId);
        }

        return mapToSignal(data);
    }

    private Signal getActivePollSignalFromCache(Long signalId, String userEmail) {
        Signal s = getPollSignalFromCache(signalId);

        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll closed", HttpStatus.BAD_REQUEST);
        }
        if (!Arrays.asList(s.getSharedWith()).contains(userEmail)) {
            throw new CustomException("User not assigned", HttpStatus.BAD_REQUEST);
        }
        return s;
    }

    private Signal getEditablePollSignalFromCache(Long signalId) {
        Signal s = getPollSignalFromCache(signalId);

        if (!ACTIVE.equals(s.getStatus())) {
            throw new CustomException("Poll completed", HttpStatus.BAD_REQUEST);
        }
        return s;
    }

    private Poll getPollFromCache(Long signalId) {
        String key = cache.buildKey("poll", signalId.toString());
        Map<String, Object> data = cache.hGetAll(key);

        if (data.isEmpty()) {
            return getPollFromDB(signalId);
        }

        Poll poll = new Poll();
        poll.setSignalId(signalId);
        poll.setQuestion((String) data.get("question"));
        poll.setOptions((String[]) data.get("options"));
        return poll;
    }

    private List<PollResult> getVotesFromCache(Long signalId) {
        String key = cache.buildKey("poll:results", signalId.toString());
        Map<String, Object> votes = cache.hGetAll(key);

        if (votes.isEmpty()) {
            return getVotesFromDB(signalId);
        }

        List<PollResult> results = new ArrayList<>();
        for (Map.Entry<String, Object> entry : votes.entrySet()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> voteData = (Map<String, Object>) entry.getValue();

            PollResult result = new PollResult();
            result.setId(new PollResultId(signalId, entry.getKey()));
            result.setSelectedOption((String) voteData.get("selectedOption"));
            result.setDefaultResponse((String) voteData.get("defaultResponse"));
            result.setReason((String) voteData.get("reason"));
            result.setTimeOfSubmission((Instant) voteData.get("timeOfSubmission"));
            results.add(result);
        }

        return results;
    }

    private Signal getPollSignalFromDB(Long signalId) {
        Signal s = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!POLL.equalsIgnoreCase(s.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }

        Poll poll = getPollFromDB(signalId);
        savePollToCache(s, poll);

        return s;
    }

    private Poll getPollFromDB(Long signalId) {
        return pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));
    }

    private List<PollResult> getVotesFromDB(Long signalId) {
        return pollResultRepository.findByIdSignalId(signalId);
    }

    private Signal mapToSignal(Map<String, Object> data) {
        Signal s = new Signal();
        s.setId(((Number) data.get("signalId")).longValue());
        s.setCreatedBy((String) data.get("createdBy"));
        s.setCreatedOn((Instant) data.get("createdOn"));
        s.setLastEdited((Instant) data.get("lastEdited"));
        s.setAnonymous((Boolean) data.get("anonymous"));
        s.setEndTimestamp((Instant) data.get("endTimestamp"));
        s.setTypeOfSignal((String) data.get("typeOfSignal"));
        s.setDefaultFlag((Boolean) data.get("defaultFlag"));
        s.setDefaultOption((String) data.get("defaultOption"));
        s.setSharedWith((String[]) data.get("sharedWith"));
        s.setStatus((String) data.get("status"));
        s.setLastEditedBy((String) data.get("lastEditedBy"));
        s.setPersistentAlert((Boolean) data.get("persistentAlert"));
        s.setLabels((String[]) data.get("labels"));
        return s;
    }

    private Signal buildSignal(PollCreateDTO dto) {
        Signal s = new Signal();
        s.setCreatedBy(dto.getCreatedBy());
        s.setAnonymous(dto.getAnonymous());
        s.setTypeOfSignal(POLL);
        s.setSharedWith(dto.getSharedWith());
        s.setDefaultFlag(dto.getDefaultFlag());
        s.setDefaultOption(dto.getDefaultOption());
        s.setEndTimestamp(dto.getEndTimestampUtc());
        s.setStatus(ACTIVE);
        s.setPersistentAlert(dto.getPersistentAlert());
        s.setLabels(dto.getLabels());
        s.setCreatedOn(Instant.now());
        return s;
    }

    private ScheduledPoll buildScheduledPoll(PollCreateDTO dto) {
        ScheduledPoll sp = new ScheduledPoll();
        sp.setQuestion(dto.getQuestion());
        sp.setOptions(dto.getOptions());
        sp.setCreatedBy(dto.getCreatedBy());
        sp.setAnonymous(dto.getAnonymous());
        sp.setSharedWith(dto.getSharedWith());
        sp.setDefaultFlag(dto.getDefaultFlag());
        sp.setDefaultOption(dto.getDefaultOption());
        sp.setScheduledTime(dto.getScheduledTime());
        sp.setEndTimestamp(dto.getEndTimestampUtc());
        sp.setPersistentAlert(dto.getPersistentAlert());
        sp.setLabels(dto.getLabels());
        return sp;
    }

    private void handleRepublishOrUnshare(PollEditDTO dto, Signal signal) {
        if (Boolean.TRUE.equals(dto.getRepublish())) {
            String votesKey = cache.buildKey("poll:results", dto.getSignalId().toString());
            cache.delete(votesKey);
            asyncDbSync.asyncDeletePollResults(dto.getSignalId());
            return;
        }

        Set<String> removedUsers = new HashSet<>(Arrays.asList(signal.getSharedWith()));
        removedUsers.removeAll(Arrays.asList(dto.getSharedWith()));

        if (!removedUsers.isEmpty()) {
            String votesKey = cache.buildKey("poll:results", dto.getSignalId().toString());
            for (String user : removedUsers) {
                cache.hSet(votesKey, user, null);
            }
            // DB sync
            pollResultRepository.deleteBySignalIdAndUserEmails(dto.getSignalId(), removedUsers);
        }
    }

    private void publish(Signal signal, Poll poll, String event, boolean republish) {
        PollSsePayload payload = PollSsePayload.builder()
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
                .build();

        pollSsePublisher.publish(signal.getSharedWith(), event, payload);
    }

    private PollResultDTO buildPollResults(Signal signal, Poll poll, List<PollResult> results) {
        Set<String> activeOptions = new LinkedHashSet<>(Arrays.asList(poll.getOptions()));

        Map<String, Integer> optionCounts = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> optionVotes = new LinkedHashMap<>();
        Map<String, List<UserVoteDTO>> removedOptions = new LinkedHashMap<>();
        Map<String, Integer> removedOptionCounts = new LinkedHashMap<>();
        List<UserVoteDTO> defaultResponses = new ArrayList<>();
        Map<String, String> reasonResponses = new LinkedHashMap<>();
        List<String> anonymousReasonTexts = new ArrayList<>();

        activeOptions.forEach(opt -> {
            optionCounts.put(opt, 0);
            optionVotes.put(opt, new ArrayList<>());
        });

        for (PollResult r : results) {
            UserVoteDTO vote = new UserVoteDTO(
                    r.getId().getUserEmail(),
                    resolveResponseText(r),
                    r.getTimeOfSubmission()
            );

            if (r.getSelectedOption() != null) {
                if (!activeOptions.contains(r.getSelectedOption())) {
                    removedOptions
                            .computeIfAbsent(r.getSelectedOption(), k -> new ArrayList<>())
                            .add(vote);
                    removedOptionCounts.compute(r.getSelectedOption(), (k, v) -> v == null ? 1 : v + 1);
                } else {
                    optionCounts.compute(r.getSelectedOption(), (k, v) -> v + 1);
                    optionVotes.get(r.getSelectedOption()).add(vote);
                }
            } else if (hasText(r.getReason())) {
                reasonResponses.put(r.getId().getUserEmail(), r.getReason());
                anonymousReasonTexts.add(r.getReason());
            } else {
                defaultResponses.add(vote);
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signal.getId());
        dto.setTotalAssigned(signal.getSharedWith().length);
        dto.setTotalResponded(
                optionVotes.values().stream().mapToInt(List::size).sum()
                        + defaultResponses.size()
                        + reasonResponses.size()
        );
        dto.setOptionCounts(optionCounts);
        dto.setDefaultCount(defaultResponses.size());
        dto.setReasonCount(reasonResponses.size());

        if (Boolean.TRUE.equals(signal.getAnonymous())) {
            dto.setAnonymousReasons(anonymousReasonTexts.isEmpty() ? null : anonymousReasonTexts);
            dto.setRemovedOptionCount(removedOptionCounts.isEmpty() ? null : removedOptionCounts);
            return dto;
        }

        dto.setOptionVotes(optionVotes.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().toArray(new UserVoteDTO[0])
                )));

        dto.setRemovedOptions(
                removedOptions.isEmpty() ? null :
                        removedOptions.entrySet().stream()
                                .collect(Collectors.toMap(
                                        Map.Entry::getKey,
                                        e -> e.getValue().toArray(new UserVoteDTO[0])
                                ))
        );

        dto.setDefaultResponses(defaultResponses.isEmpty() ? null :
                defaultResponses.toArray(new UserVoteDTO[0]));

        dto.setReasonResponses(reasonResponses.isEmpty() ? null : reasonResponses);

        return dto;
    }

    private String resolveResponseText(PollResult r) {
        if (r.getSelectedOption() != null) return r.getSelectedOption();
        if (r.getDefaultResponse() != null) return r.getDefaultResponse();
        return r.getReason();
    }
}