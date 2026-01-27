package com.sentinel.backend.service;

import com.sentinel.backend.cache.AsyncDbSyncService;
import com.sentinel.backend.cache.BatchPollResultService;
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
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static com.sentinel.backend.constant.CacheKeys.LOCK_POLL_DELETE_PREFIX;
import static com.sentinel.backend.constant.CacheKeys.LOCK_POLL_EDIT_PREFIX;
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
    private final BatchPollResultService batchPollResultService;
    private final PollSsePublisher pollSsePublisher;
    private final PollSchedulerService pollSchedulerService;
    private final RedissonClient redissonClient;
    private final PollCacheHelper pollCacheHelper;

    // Flag for one-time signal counter initialization
    private final AtomicBoolean counterInitialized = new AtomicBoolean(false);

    /**
     * Cached poll data record to avoid duplicate Redis calls.
     * Combines Signal and Poll data from a single cache read.
     */
    private record CachedPollData(Signal signal, Poll poll) {}

    @Override
    public CreatePollResponse createPoll(PollCreateDTO dto) {
        normalizeAndValidatePollDto(dto);

        // OPTIMIZATION: Removed global lock - INCR is atomic, no lock needed
        Long signalId = getNextSignalId();

        Signal signal = buildSignal(dto);
        signal.setId(signalId);

        Poll poll = new Poll();
        poll.setSignalId(signalId);
        poll.setSignal(signal);
        poll.setQuestion(dto.getQuestion());
        poll.setOptions(dto.getOptions());

        pollCacheHelper.savePollToCache(signal, poll);

        asyncDbSync.asyncSaveSignalWithPoll(signal, poll);

        publishPollEvent(signal, poll, POLL_CREATED, false);

        log.info("[POLL][CREATE] signalId={} | localId={} | recipientCount={}",
                signalId, dto.getLocalId(), signal.getSharedWith().length);

        return new CreatePollResponse(signalId, dto.getLocalId());
    }

    /**
     * Gets next signal ID using atomic Redis INCR.
     * Falls back to DB only on first call or Redis failure.
     */
    private Long getNextSignalId() {
        Long signalId = cache.incr(SIGNAL_ID_COUNTER);
        if (signalId != null) {
            return signalId;
        }

        // Fallback: Initialize from DB (thread-safe, one-time)
        return initializeSignalCounter();
    }

    private synchronized Long initializeSignalCounter() {
        // Double-check after acquiring lock
        if (counterInitialized.get()) {
            Long signalId = cache.incr(SIGNAL_ID_COUNTER);
            if (signalId != null) {
                return signalId;
            }
        }

        Long dbId = signalRepository.getNextSignalId();
        cache.set(SIGNAL_ID_COUNTER, dbId.toString(), null);
        counterInitialized.set(true);
        log.info("[SIGNAL][COUNTER_INIT] Initialized signal counter from DB: {}", dbId);
        return dbId;
    }

    @Override
    @Transactional
    public CreatePollResponse createScheduledPoll(PollCreateDTO dto) {
        normalizeAndValidatePollDto(dto);

        // OPTIMIZATION: Removed global lock - INCR is atomic
        Long reservedId = getNextSignalId();

        ScheduledPoll scheduledPoll = buildScheduledPoll(dto);
        scheduledPoll.setReservedSignalId(reservedId);

        scheduledPollRepository.save(scheduledPoll);

        String key = cache.buildKey(SCHEDULED_POLL, reservedId.toString());
        cache.set(key, scheduledPoll, cache.getPollTtl());

        pollSchedulerService.scheduleTask(scheduledPoll);

        log.info("[POLL][SCHEDULE] reservedId={} | scheduledTime={}",
                reservedId, dto.getScheduledTime());

        return new CreatePollResponse(reservedId, dto.getLocalId());
    }

    @Override
    public void submitOrUpdateVote(PollSubmitDTO dto) {
        dto.normalize();
        long start = System.currentTimeMillis();

        Long signalId = dto.getSignalId();
        String userEmail = dto.getUserEmail();

        // OPTIMIZATION: Lock-free vote submission
        // Redis HSET is atomic, and batch insert handles duplicates via upsert
        Signal signal = getActivePollSignalFromCache(signalId, userEmail);

        PollResultId id = new PollResultId(signalId, userEmail);
        PollResult result = new PollResult();
        result.setId(id);
        result.setSignal(signal);
        result.setSelectedOption(dto.getSelectedOption());
        result.setDefaultResponse(dto.getDefaultResponse());
        result.setReason(dto.getReason());
        result.setTimeOfSubmission(Instant.now());

        // Atomic Redis write (no lock needed - HSET is atomic)
        saveVoteToCachePipelined(result);

        // Async batch insert (idempotent upsert)
        batchPollResultService.queueForBatchInsert(result);

        if (log.isInfoEnabled()) {
            log.info("[POLL][VOTE][LOCK_FREE] signalId={} | user={} | option={} | durationMs={}",
                    signalId, userEmail, dto.getSelectedOption(), System.currentTimeMillis() - start);
        }
    }

    public void submitOrUpdateVoteLegacy(PollSubmitDTO dto) {
        dto.normalize();

        Long signalId = dto.getSignalId();
        String userEmail = dto.getUserEmail();
        String lockKey = LOCK_VOTE_PREFIX + signalId + ":" + userEmail;

        executeWithLock(lockKey, 2, () -> {
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

            log.info("[POLL][VOTE][LEGACY] signalId={} | user={} | option={}",
                    signalId, userEmail, dto.getSelectedOption());
        });
    }

    @Override
    public PollResultDTO getPollResults(Long signalId) {
        long start = System.currentTimeMillis();
        String cacheKey = cache.buildKey(POLL_RESULTS_CACHED, signalId.toString());
        PollResultDTO cached = cache.get(cacheKey, PollResultDTO.class);

        if (cached != null) {
            if (log.isInfoEnabled()) {
                log.info("[POLL][RESULTS][CACHE_HIT] signalId={} | responded={}/{} | durationMs={}",
                        signalId, cached.getTotalResponded(), cached.getTotalAssigned(), System.currentTimeMillis() - start);
            }
            return cached;
        }

        if (log.isDebugEnabled()) {
            log.debug("[POLL][RESULTS][CACHE_MISS] signalId={} | fetching from source", signalId);
        }

        // OPTIMIZATION: Single Redis call for both Signal and Poll data
        CachedPollData pollData = getCombinedPollDataFromCache(signalId);
        List<PollResult> results = getVotesFromCache(signalId);

        PollResultDTO dto = buildPollResults(pollData.signal(), pollData.poll(), results);
        cache.set(cacheKey, dto, cache.getPollResultsTtl());

        if (log.isInfoEnabled()) {
            log.info("[POLL][RESULTS][BUILT] signalId={} | responded={}/{} | durationMs={}",
                    signalId, dto.getTotalResponded(), dto.getTotalAssigned(), System.currentTimeMillis() - start);
        }

        return dto;
    }

    /**
     * OPTIMIZATION: Fetches both Signal and Poll data in a single Redis call.
     * Previously this was 2 separate hGetAll calls on the same key.
     */
    private CachedPollData getCombinedPollDataFromCache(Long signalId) {
        long start = System.currentTimeMillis();
        String key = cache.buildKey(POLL, signalId.toString());
        Map<String, Object> data = cache.hGetAll(key);

        if (data.isEmpty()) {
            if (log.isInfoEnabled()) {
                log.info("[POLL][CACHE_MISS] signalId={} | durationMs={} | fallback=DB", signalId, System.currentTimeMillis() - start);
            }
            return loadAndCachePollFromDB(signalId);
        }

        if (log.isDebugEnabled()) {
            log.debug("[POLL][CACHE_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        }

        Signal signal = mapToSignal(data);
        Poll poll = mapToPoll(data, signalId);
        return new CachedPollData(signal, poll);
    }

    private CachedPollData loadAndCachePollFromDB(Long signalId) {
        long start = System.currentTimeMillis();
        Signal signal = signalRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Signal not found", HttpStatus.NOT_FOUND));

        if (!com.sentinel.backend.constant.Constants.POLL.equalsIgnoreCase(signal.getTypeOfSignal())) {
            throw new CustomException("Not a poll", HttpStatus.BAD_REQUEST);
        }

        Poll poll = pollRepository.findById(signalId)
                .orElseThrow(() -> new CustomException("Poll not found", HttpStatus.NOT_FOUND));

        pollCacheHelper.savePollToCache(signal, poll);

        if (log.isInfoEnabled()) {
            log.info("[POLL][DB_HIT] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        }

        return new CachedPollData(signal, poll);
    }

    private Poll mapToPoll(Map<String, Object> data, Long signalId) {
        Poll poll = new Poll();
        poll.setSignalId(signalId);
        poll.setQuestion((String) data.get("question"));
        poll.setOptions(parseStringArray(data.get("options")));
        return poll;
    }

    @Override
    public void editSignal(PollEditDTO dto) {
        normalizeAndValidatePollDto(dto);

        Long signalId = dto.getSignalId();
        String lockKey = LOCK_POLL_EDIT_PREFIX + signalId;

        executeWithLock(lockKey, 5, () -> {
            // OPTIMIZATION: Single cache call for both Signal and Poll
            CachedPollData pollData = getCombinedPollDataFromCache(signalId);
            Signal signal = pollData.signal();
            Poll poll = pollData.poll();

            if (!ACTIVE.equals(signal.getStatus())) {
                throw new CustomException("Poll completed", HttpStatus.BAD_REQUEST);
            }

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
        });
    }

    @Override
    @Transactional
    public void editScheduledSignal(PollEditDTO dto) {
        normalizeAndValidatePollDto(dto);

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
        String signalIdStr = signalId.toString();

        executeWithLock(lockKey, 5, () -> {
            long start = System.currentTimeMillis();
            Signal signal = getPollSignalFromCache(signalId);

            List<String> keysToDelete = List.of(
                    cache.buildKey(POLL, signalIdStr),
                    cache.buildKey(POLL_RESULTS, signalIdStr),
                    cache.buildKey(POLL_RESULTS_CACHED, signalIdStr)
            );
            cache.pipelinedDelete(keysToDelete);

            asyncDbSync.asyncDeletePollResults(signalId);
            asyncDbSync.asyncDeletePoll(signalId);
            asyncDbSync.asyncDeleteSignal(signalId);

            pollSsePublisher.publish(signal.getSharedWith(), POLL_DELETED, signalId);

            log.info("[POLL][DELETE] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        });
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

    private void saveVoteToCachePipelined(PollResult result) {
        String signalIdStr = result.getId().getSignalId().toString();
        String voteKey = cache.buildKey(POLL_RESULTS, signalIdStr);
        String invalidateKey = cache.buildKey(POLL_RESULTS_CACHED, signalIdStr);

        // OPTIMIZATION: Pre-sized HashMap (4 entries)
        Map<String, Object> voteData = new HashMap<>(4);
        voteData.put("selectedOption", result.getSelectedOption());
        voteData.put("defaultResponse", result.getDefaultResponse());
        voteData.put("reason", result.getReason());
        voteData.put("timeOfSubmission", result.getTimeOfSubmission());

        cache.pipelinedVoteSubmit(voteKey, result.getId().getUserEmail(), voteData, invalidateKey);
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
        log.debug("[VOTE][CACHE_WRITE][SEQUENTIAL] signalId={} | user={} | durationMs={}",
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

        // OPTIMIZATION: O(1) HashSet lookup instead of O(n) array contains
        String[] sharedWith = signal.getSharedWith();
        if (sharedWith == null || !Set.of(sharedWith).contains(userEmail)) {
            throw new CustomException("User not assigned", HttpStatus.BAD_REQUEST);
        }
        return signal;
    }

    // REMOVED: getEditablePollSignalFromCache - replaced with inline logic in editSignal
    // REMOVED: getPollFromCache - replaced by getCombinedPollDataFromCache

    private List<PollResult> getVotesFromCache(Long signalId) {
        long start = System.currentTimeMillis();
        String key = cache.buildKey(POLL_RESULTS, signalId.toString());
        Map<String, Object> votes = cache.hGetAll(key);

        if (votes.isEmpty()) {
            if (log.isInfoEnabled()) {
                log.info("[VOTES][CACHE_MISS] signalId={} | durationMs={} | fallback=DB", signalId, System.currentTimeMillis() - start);
            }
            return getVotesFromDB(signalId);
        }

        // OPTIMIZATION: Pre-size ArrayList
        List<PollResult> results = new ArrayList<>(votes.size());
        for (Map.Entry<String, Object> entry : votes.entrySet()) {
            @SuppressWarnings("unchecked")
            Map<String, Object> voteData = (Map<String, Object>) entry.getValue();

            PollResult result = new PollResult();
            result.setId(new PollResultId(signalId, entry.getKey()));
            result.setSelectedOption((String) voteData.get("selectedOption"));
            result.setDefaultResponse((String) voteData.get("defaultResponse"));
            result.setReason((String) voteData.get("reason"));
            result.setTimeOfSubmission(parseInstant(voteData.get("timeOfSubmission")));
            results.add(result);
        }

        if (log.isDebugEnabled()) {
            log.debug("[VOTES][CACHE_HIT] signalId={} | voteCount={} | durationMs={}", signalId, results.size(), System.currentTimeMillis() - start);
        }
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
        signal.setCreatedOn(parseInstant(data.get("createdOn")));
        signal.setLastEdited(parseInstant(data.get("lastEdited")));
        signal.setAnonymous(parseBoolean(data.get("anonymous")));
        signal.setEndTimestamp(parseInstant(data.get("endTimestamp")));
        signal.setTypeOfSignal((String) data.get("typeOfSignal"));
        signal.setDefaultFlag(parseBoolean(data.get("defaultFlag")));
        signal.setDefaultOption((String) data.get("defaultOption"));
        signal.setSharedWith(parseStringArray(data.get("sharedWith")));
        signal.setStatus((String) data.get("status"));
        signal.setLastEditedBy((String) data.get("lastEditedBy"));
        signal.setPersistentAlert(parseBoolean(data.get("persistentAlert")));
        signal.setLabels(parseStringArray(data.get("labels")));
        signal.setTitle((String) data.get("title"));
        return signal;
    }

    // OPTIMIZATION: Order checks by probability - Instant is most common from cache
    private Instant parseInstant(Object value) {
        if (value instanceof Instant i) return i;  // Most common from cache - pattern matching
        if (value == null) return null;
        if (value instanceof Number n) return Instant.ofEpochMilli(n.longValue());
        if (value instanceof String s) return Instant.parse(s);
        throw new IllegalArgumentException("Cannot parse Instant from: " + value.getClass());
    }

    private Boolean parseBoolean(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof String) {
            return Boolean.parseBoolean((String) value);
        }
        throw new IllegalArgumentException("Cannot parse Boolean from: " + value.getClass());
    }

    @SuppressWarnings("unchecked")
    private String[] parseStringArray(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof String[]) {
            return (String[]) value;
        }
        if (value instanceof List) {
            List<String> list = (List<String>) value;
            return list.toArray(new String[0]);
        }
        throw new IllegalArgumentException("Cannot parse String[] from: " + value.getClass());
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
        String[] options = poll.getOptions();
        int optionCount = options.length;
        int resultCount = results.size();

        // OPTIMIZATION: Pre-sized collections to reduce reallocations
        Set<String> activeOptionsSet = new HashSet<>(optionCount);
        Map<String, Integer> optionCounts = new LinkedHashMap<>(optionCount);
        Map<String, List<UserVoteDTO>> optionVotes = new LinkedHashMap<>(optionCount);

        // Initialize with capacity hints
        for (String opt : options) {
            activeOptionsSet.add(opt);
            optionCounts.put(opt, 0);
            optionVotes.put(opt, new ArrayList<>(resultCount / optionCount + 1));
        }

        Map<String, List<UserVoteDTO>> removedOptions = new LinkedHashMap<>(4);
        Map<String, Integer> removedOptionCounts = new LinkedHashMap<>(4);
        List<UserVoteDTO> defaultResponses = new ArrayList<>(resultCount / 10 + 1);
        Map<String, String> reasonResponses = new LinkedHashMap<>(resultCount / 10 + 1);
        List<String> anonymousReasonTexts = new ArrayList<>(resultCount / 10 + 1);

        int totalVotes = 0;

        for (PollResult result : results) {
            String selectedOption = result.getSelectedOption();

            if (selectedOption != null) {
                UserVoteDTO vote = new UserVoteDTO(
                        result.getId().getUserEmail(),
                        selectedOption,
                        result.getTimeOfSubmission()
                );

                // OPTIMIZATION: O(1) HashSet lookup instead of LinkedHashSet
                if (activeOptionsSet.contains(selectedOption)) {
                    optionCounts.merge(selectedOption, 1, Integer::sum);
                    optionVotes.get(selectedOption).add(vote);
                    totalVotes++;
                } else {
                    removedOptions.computeIfAbsent(selectedOption, k -> new ArrayList<>()).add(vote);
                    removedOptionCounts.merge(selectedOption, 1, Integer::sum);
                    totalVotes++;
                }
            } else if (hasText(result.getReason())) {
                reasonResponses.put(result.getId().getUserEmail(), result.getReason());
                anonymousReasonTexts.add(result.getReason());
            } else {
                UserVoteDTO vote = new UserVoteDTO(
                        result.getId().getUserEmail(),
                        result.getDefaultResponse(),
                        result.getTimeOfSubmission()
                );
                defaultResponses.add(vote);
            }
        }

        PollResultDTO dto = new PollResultDTO();
        dto.setSignalId(signal.getId());
        dto.setTotalAssigned(signal.getSharedWith().length);
        dto.setTotalResponded(totalVotes + defaultResponses.size() + reasonResponses.size());
        dto.setOptionCounts(optionCounts);
        dto.setDefaultCount(defaultResponses.size());
        dto.setReasonCount(reasonResponses.size());

        if (Boolean.TRUE.equals(signal.getAnonymous())) {
            dto.setAnonymousReasons(anonymousReasonTexts.isEmpty() ? null : anonymousReasonTexts);
            dto.setRemovedOptionCount(removedOptionCounts.isEmpty() ? null : removedOptionCounts);
            return dto;
        }

        // OPTIMIZATION: Avoid stream for simple map transformation
        Map<String, UserVoteDTO[]> optionVotesArray = new LinkedHashMap<>(optionVotes.size());
        for (Map.Entry<String, List<UserVoteDTO>> entry : optionVotes.entrySet()) {
            optionVotesArray.put(entry.getKey(), entry.getValue().toArray(new UserVoteDTO[0]));
        }
        dto.setOptionVotes(optionVotesArray);

        if (!removedOptions.isEmpty()) {
            Map<String, UserVoteDTO[]> removedOptionsArray = new LinkedHashMap<>(removedOptions.size());
            for (Map.Entry<String, List<UserVoteDTO>> entry : removedOptions.entrySet()) {
                removedOptionsArray.put(entry.getKey(), entry.getValue().toArray(new UserVoteDTO[0]));
            }
            dto.setRemovedOptions(removedOptionsArray);
        }

        dto.setDefaultResponses(defaultResponses.isEmpty() ? null : defaultResponses.toArray(new UserVoteDTO[0]));
        dto.setReasonResponses(reasonResponses.isEmpty() ? null : reasonResponses);

        return dto;
    }

    // REMOVED: resolveResponseText - inlined in buildPollResults
    // REMOVED: executeWithLock(Supplier) - no longer needed after lock-free refactoring

    private void executeWithLock(String lockKey, int timeoutSeconds, Runnable operation) {
        RLock lock = redissonClient.getLock(lockKey);
        try {
            lock.lock(timeoutSeconds, TimeUnit.SECONDS);
            operation.run();
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private void normalizeAndValidatePollDto(PollCreateDTO dto) {
        dto.normalizeCommon();
        dto.normalizePoll();
        dto.validateCommon();
        dto.validatePoll();
    }
}