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
import com.sentinel.backend.util.PollCacheHelper;
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

import static com.sentinel.backend.constant.CacheKeys.LOCK_POLL_DELETE_PREFIX;
import static com.sentinel.backend.constant.CacheKeys.LOCK_POLL_EDIT_PREFIX;
import static com.sentinel.backend.constant.CacheKeys.LOCK_SIGNAL_CREATE;
import static com.sentinel.backend.constant.CacheKeys.LOCK_VOTE_PREFIX;
import static com.sentinel.backend.constant.CacheKeys.POLL;
import static com.sentinel.backend.constant.CacheKeys.POLL_RESULTS;
import static com.sentinel.backend.constant.CacheKeys.POLL_RESULTS_CACHED;
import static com.sentinel.backend.constant.CacheKeys.SCHEDULED_POLL;
import static com.sentinel.backend.constant.CacheKeys.SIGNAL_ID_COUNTER;
import static com.sentinel.backend.constant.Constants.ACTIVE;
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
    private final PollCacheHelper pollCacheHelper;

    @Override
    public CreatePollResponse createPoll(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        RLock lock = redissonClient.getLock(LOCK_SIGNAL_CREATE);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Long signalId = cache.incr(SIGNAL_ID_COUNTER);
            if (signalId == null) {
                signalId = signalRepository.getNextSignalId();
                cache.set(SIGNAL_ID_COUNTER, signalId.toString(), null);
            }

            Signal signal = buildSignal(dto);
            signal.setId(signalId);

            Poll poll = new Poll();
            poll.setSignalId(signalId);
            poll.setSignal(signal);
            poll.setQuestion(dto.getQuestion());
            poll.setOptions(dto.getOptions());

            pollCacheHelper.savePollToCache(signal, poll);

            asyncDbSync.asyncSaveSignal(signal);
            asyncDbSync.asyncSavePoll(poll);

            publishPollEvent(signal, poll, POLL_CREATED, false);

            log.info("[POLL][CREATE] signalId={} | localId={} | recipientCount={}",
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

        RLock lock = redissonClient.getLock(LOCK_SIGNAL_CREATE);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Long reservedId = cache.incr(SIGNAL_ID_COUNTER);
            if (reservedId == null) {
                reservedId = signalRepository.getNextSignalId();
                cache.set(SIGNAL_ID_COUNTER, reservedId.toString(), null);
            }

            ScheduledPoll scheduledPoll = buildScheduledPoll(dto);
            scheduledPoll.setReservedSignalId(reservedId);

            scheduledPollRepository.save(scheduledPoll);

            String key = cache.buildKey(SCHEDULED_POLL, reservedId.toString());
            cache.set(key, scheduledPoll, cache.getPollTtl());

            pollSchedulerService.scheduleTask(scheduledPoll);

            log.info("[POLL][SCHEDULE] reservedId={} | scheduledTime={}",
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

        String lockKey = LOCK_VOTE_PREFIX + signalId + ":" + userEmail;
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
            invalidatePollResultsCache(signalId);

            asyncDbSync.asyncSavePollResult(result);

            log.info("[POLL][VOTE] signalId={} | user={} | option={}",
                    signalId, userEmail, dto.getSelectedOption());

        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Override
    public PollResultDTO getPollResults(Long signalId) {
        long start = System.currentTimeMillis();
        String cacheKey = cache.buildKey(POLL_RESULTS_CACHED, signalId.toString());
        PollResultDTO cached = cache.get(cacheKey, PollResultDTO.class);

        if (cached != null) {
            log.info("[POLL][RESULTS][CACHE_HIT] signalId={} | responded={}/{} | durationMs={}",
                    signalId, cached.getTotalResponded(), cached.getTotalAssigned(), System.currentTimeMillis() - start);
            return cached;
        }

        log.debug("[POLL][RESULTS][CACHE_MISS] signalId={} | fetching from source", signalId);

        Signal signal = getPollSignalFromCache(signalId);
        Poll poll = getPollFromCache(signalId);
        List<PollResult> results = getVotesFromCache(signalId);

        PollResultDTO dto = buildPollResults(signal, poll, results);
        cache.set(cacheKey, dto, cache.getPollResultsTtl());

        log.info("[POLL][RESULTS][BUILT] signalId={} | responded={}/{} | durationMs={}",
                signalId, dto.getTotalResponded(), dto.getTotalAssigned(), System.currentTimeMillis() - start);

        return dto;
    }

    @Override
    public void editSignal(PollEditDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();

        Long signalId = dto.getSignalId();
        String lockKey = LOCK_POLL_EDIT_PREFIX + signalId;
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
            signal.setTitle(dto.getTitle());

            pollCacheHelper.savePollToCache(signal, poll);
            invalidatePollResultsCache(signalId);

            asyncDbSync.asyncUpdateSignal(signal);
            asyncDbSync.asyncUpdatePoll(poll);

            publishPollEvent(signal, poll, POLL_EDITED, dto.getRepublish());

            log.info("[POLL][EDIT] signalId={} | republish={}", signalId, dto.getRepublish());

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
        scheduledPoll.setTitle(dto.getTitle());

        scheduledPollRepository.save(scheduledPoll);

        String key = cache.buildKey(SCHEDULED_POLL, dto.getSignalId().toString());
        cache.set(key, scheduledPoll, cache.getPollTtl());

        pollSchedulerService.rescheduleTask(scheduledPoll);

        log.info("[POLL][SCHEDULE_EDIT] reservedId={}", dto.getSignalId());
    }

    @Override
    public void deleteSignal(Long signalId) {
        String lockKey = LOCK_POLL_DELETE_PREFIX + signalId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            lock.lock(5, TimeUnit.SECONDS);

            Signal signal = getPollSignalFromCache(signalId);

            cache.delete(cache.buildKey(POLL, signalId.toString()));
            cache.delete(cache.buildKey(POLL_RESULTS, signalId.toString()));
            invalidatePollResultsCache(signalId);

            asyncDbSync.asyncDeletePollResults(signalId);
            asyncDbSync.asyncDeletePoll(signalId);
            asyncDbSync.asyncDeleteSignal(signalId);

            pollSsePublisher.publish(signal.getSharedWith(), POLL_DELETED, signalId);

            log.info("[POLL][DELETE] signalId={}", signalId);

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
        cache.delete(cache.buildKey(SCHEDULED_POLL, signalId.toString()));

        log.info("[POLL][SCHEDULE_DELETE] reservedId={}", signalId);
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

    private void invalidatePollResultsCache(Long signalId) {
        cache.delete(cache.buildKey(POLL_RESULTS_CACHED, signalId.toString()));
        log.debug("[POLL][CACHE_INVALIDATE] signalId={}", signalId);
    }

    private void saveVoteToCache(PollResult result) {
        long start = System.currentTimeMillis();
        String voteKey = cache.buildKey(POLL_RESULTS, result.getId().getSignalId().toString());

        Map<String, Object> voteData = new HashMap<>();
        voteData.put("selectedOption", result.getSelectedOption());
        voteData.put("defaultResponse", result.getDefaultResponse());
        voteData.put("reason", result.getReason());
        voteData.put("timeOfSubmission", result.getTimeOfSubmission());

        cache.hSet(voteKey, result.getId().getUserEmail(), voteData);
        log.debug("[VOTE][CACHE_WRITE] signalId={} | user={} | durationMs={}",
                result.getId().getSignalId(), result.getId().getUserEmail(), System.currentTimeMillis() - start);
    }

    private Signal getPollSignalFromCache(Long signalId) {
        long start = System.currentTimeMillis();
        String key = cache.buildKey(POLL, signalId.toString());
        Map<String, Object> data = cache.hGetAll(key);

        if (data.isEmpty()) {
            log.info("[SIGNAL][CACHE_MISS] signalId={} | durationMs={} | fallback=DB", signalId, System.currentTimeMillis() - start);
            return getPollSignalFromDB(signalId);
        }

        log.info("[SIGNAL][CACHE_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return mapToSignal(data);
    }

    private Signal getActivePollSignalFromCache(Long signalId, String userEmail) {
        Signal signal = getPollSignalFromCache(signalId);

        if (!ACTIVE.equals(signal.getStatus())) {
            throw new CustomException("Poll closed", HttpStatus.BAD_REQUEST);
        }
        if (!Arrays.asList(signal.getSharedWith()).contains(userEmail)) {
            throw new CustomException("User not assigned", HttpStatus.BAD_REQUEST);
        }
        return signal;
    }

    private Signal getEditablePollSignalFromCache(Long signalId) {
        Signal signal = getPollSignalFromCache(signalId);

        if (!ACTIVE.equals(signal.getStatus())) {
            throw new CustomException("Poll completed", HttpStatus.BAD_REQUEST);
        }
        return signal;
    }

    private Poll getPollFromCache(Long signalId) {
        long start = System.currentTimeMillis();
        String key = cache.buildKey(POLL, signalId.toString());
        Map<String, Object> data = cache.hGetAll(key);

        if (data.isEmpty()) {
            log.info("[POLL][CACHE_MISS] signalId={} | durationMs={} | fallback=DB", signalId, System.currentTimeMillis() - start);
            return getPollFromDB(signalId);
        }

        Poll poll = new Poll();
        poll.setSignalId(signalId);
        poll.setQuestion((String) data.get("question"));
        poll.setOptions((String[]) data.get("options"));
        log.info("[POLL][CACHE_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return poll;
    }

    private List<PollResult> getVotesFromCache(Long signalId) {
        long start = System.currentTimeMillis();
        String key = cache.buildKey(POLL_RESULTS, signalId.toString());
        Map<String, Object> votes = cache.hGetAll(key);

        if (votes.isEmpty()) {
            log.info("[VOTES][CACHE_MISS] signalId={} | durationMs={} | fallback=DB", signalId, System.currentTimeMillis() - start);
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

        log.info("[VOTES][CACHE_HIT] signalId={} | voteCount={} | durationMs={}", signalId, results.size(), System.currentTimeMillis() - start);
        return results;
    }

    private Signal getPollSignalFromDB(Long signalId) {
        long start = System.currentTimeMillis();
        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!com.sentinel.backend.constant.Constants.POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }

        log.info("[SIGNAL][DB_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);

        Poll poll = getPollFromDB(signalId);
        pollCacheHelper.savePollToCache(signal, poll);

        return signal;
    }

    private Poll getPollFromDB(Long signalId) {
        long start = System.currentTimeMillis();
        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));
        log.info("[POLL][DB_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return poll;
    }

    private List<PollResult> getVotesFromDB(Long signalId) {
        long start = System.currentTimeMillis();
        List<PollResult> results = pollResultRepository.findByIdSignalId(signalId);
        log.info("[VOTES][DB_HIT] signalId={} | voteCount={} | durationMs={}", signalId, results.size(), System.currentTimeMillis() - start);
        return results;
    }

    private Signal mapToSignal(Map<String, Object> data) {
        Signal signal = new Signal();
        signal.setId(((Number) data.get("signalId")).longValue());
        signal.setCreatedBy((String) data.get("createdBy"));
        signal.setCreatedOn((Instant) data.get("createdOn"));
        signal.setLastEdited((Instant) data.get("lastEdited"));
        signal.setAnonymous((Boolean) data.get("anonymous"));
        signal.setEndTimestamp((Instant) data.get("endTimestamp"));
        signal.setTypeOfSignal((String) data.get("typeOfSignal"));
        signal.setDefaultFlag((Boolean) data.get("defaultFlag"));
        signal.setDefaultOption((String) data.get("defaultOption"));
        signal.setSharedWith((String[]) data.get("sharedWith"));
        signal.setStatus((String) data.get("status"));
        signal.setLastEditedBy((String) data.get("lastEditedBy"));
        signal.setPersistentAlert((Boolean) data.get("persistentAlert"));
        signal.setLabels((String[]) data.get("labels"));
        signal.setTitle((String) data.get("title"));
        return signal;
    }

    private Signal buildSignal(PollCreateDTO dto) {
        Signal signal = new Signal();
        signal.setCreatedBy(dto.getCreatedBy());
        signal.setAnonymous(dto.getAnonymous());
        signal.setTypeOfSignal(com.sentinel.backend.constant.Constants.POLL);
        signal.setSharedWith(dto.getSharedWith());
        signal.setDefaultFlag(dto.getDefaultFlag());
        signal.setDefaultOption(dto.getDefaultOption());
        signal.setEndTimestamp(dto.getEndTimestampUtc());
        signal.setStatus(ACTIVE);
        signal.setPersistentAlert(dto.getPersistentAlert());
        signal.setLabels(dto.getLabels());
        signal.setCreatedOn(Instant.now());
        signal.setTitle(dto.getTitle());
        return signal;
    }

    private ScheduledPoll buildScheduledPoll(PollCreateDTO dto) {
        ScheduledPoll scheduledPoll = new ScheduledPoll();
        scheduledPoll.setQuestion(dto.getQuestion());
        scheduledPoll.setOptions(dto.getOptions());
        scheduledPoll.setCreatedBy(dto.getCreatedBy());
        scheduledPoll.setAnonymous(dto.getAnonymous());
        scheduledPoll.setSharedWith(dto.getSharedWith());
        scheduledPoll.setDefaultFlag(dto.getDefaultFlag());
        scheduledPoll.setDefaultOption(dto.getDefaultOption());
        scheduledPoll.setScheduledTime(dto.getScheduledTime());
        scheduledPoll.setEndTimestamp(dto.getEndTimestampUtc());
        scheduledPoll.setPersistentAlert(dto.getPersistentAlert());
        scheduledPoll.setLabels(dto.getLabels());
        scheduledPoll.setTitle(dto.getTitle());
        return scheduledPoll;
    }

    private void handleRepublishOrUnshare(PollEditDTO dto, Signal signal) {
        if (Boolean.TRUE.equals(dto.getRepublish())) {
            String votesKey = cache.buildKey(POLL_RESULTS, dto.getSignalId().toString());
            cache.delete(votesKey);
            asyncDbSync.asyncDeletePollResults(dto.getSignalId());
            return;
        }

        Set<String> removedUsers = new HashSet<>(Arrays.asList(signal.getSharedWith()));
        removedUsers.removeAll(Arrays.asList(dto.getSharedWith()));

        if (!removedUsers.isEmpty()) {
            String votesKey = cache.buildKey(POLL_RESULTS, dto.getSignalId().toString());
            for (String user : removedUsers) {
                cache.hSet(votesKey, user, null);
            }
            pollResultRepository.deleteBySignalIdAndUserEmails(dto.getSignalId(), removedUsers);
        }
    }

    private void publishPollEvent(Signal signal, Poll poll, String event, boolean republish) {
        pollSsePublisher.publish(
                signal.getSharedWith(),
                event,
                pollCacheHelper.buildPollSsePayload(signal, poll, republish)
        );
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

        for (PollResult result : results) {
            UserVoteDTO vote = new UserVoteDTO(
                    result.getId().getUserEmail(),
                    resolveResponseText(result),
                    result.getTimeOfSubmission()
            );

            if (result.getSelectedOption() != null) {
                if (!activeOptions.contains(result.getSelectedOption())) {
                    removedOptions
                            .computeIfAbsent(result.getSelectedOption(), k -> new ArrayList<>())
                            .add(vote);
                    removedOptionCounts.compute(result.getSelectedOption(), (k, v) -> v == null ? 1 : v + 1);
                } else {
                    optionCounts.compute(result.getSelectedOption(), (k, v) -> v + 1);
                    optionVotes.get(result.getSelectedOption()).add(vote);
                }
            } else if (hasText(result.getReason())) {
                reasonResponses.put(result.getId().getUserEmail(), result.getReason());
                anonymousReasonTexts.add(result.getReason());
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

    private String resolveResponseText(PollResult result) {
        if (result.getSelectedOption() != null) return result.getSelectedOption();
        if (result.getDefaultResponse() != null) return result.getDefaultResponse();
        return result.getReason();
    }
}