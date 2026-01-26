package com.sentinel.backend.cache;

import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.repository.PollRepository;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.SignalRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static com.sentinel.backend.constant.CacheKeys.FAILED_OPS;
import static com.sentinel.backend.constant.Constants.STATUS_DELETED;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncDbSyncService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final RedisCacheService cacheService;

    private static final Duration FAILED_OPS_TTL = Duration.ofHours(24);

    @Value("${async.db.sync.enabled:true}")
    private boolean syncEnabled;

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncUpdateSignal(Signal signal) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            signalRepository.save(signal);
            log.info("[DB_SYNC][SIGNAL][UPDATE] signalId={} | durationMs={}", signal.getId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][SIGNAL][UPDATE][ERROR] signalId={} | error={}", signal.getId(), e.getMessage(), e);
            storeFailedOperation("signal:update:" + signal.getId(), signal);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncDeleteSignal(Long signalId) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            signalRepository.updateSignalStatus(signalId, STATUS_DELETED);
            log.info("[DB_SYNC][SIGNAL][DELETE] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][SIGNAL][DELETE][ERROR] signalId={} | error={}", signalId, e.getMessage(), e);
            storeFailedOperation("signal:delete:" + signalId, signalId);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncSaveSignalWithPoll(Signal signal, Poll poll) {
        if (!syncEnabled) {
            log.debug("[DB_SYNC][SIGNAL_POLL][SKIP] Sync disabled");
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();

            signalRepository.save(signal);
            log.debug("[DB_SYNC][SIGNAL_POLL][SIGNAL_SAVED] signalId={} | durationMs={}", 
                    signal.getId(), System.currentTimeMillis() - start);

            poll.setSignal(signal);
            poll.setSignalId(signal.getId());
            pollRepository.save(poll);
            
            log.info("[DB_SYNC][SIGNAL_POLL][COMPLETE] signalId={} | totalDurationMs={}", 
                    signal.getId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][SIGNAL_POLL][ERROR] signalId={} | error={}", signal.getId(), e.getMessage(), e);
            storeFailedOperation("signal_poll:save:" + signal.getId(), signal);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncUpdatePoll(Poll poll) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollRepository.save(poll);
            log.info("[DB_SYNC][POLL][UPDATE] signalId={} | durationMs={}", poll.getSignalId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][POLL][UPDATE][ERROR] signalId={} | error={}", poll.getSignalId(), e.getMessage(), e);
            storeFailedOperation("poll:update:" + poll.getSignalId(), poll);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncDeletePoll(Long signalId) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollRepository.deleteBySignalId(signalId);
            log.info("[DB_SYNC][POLL][DELETE] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][POLL][DELETE][ERROR] signalId={} | error={}", signalId, e.getMessage(), e);
            storeFailedOperation("poll:delete:" + signalId, signalId);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncSavePollResult(PollResult result) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollResultRepository.save(result);
            log.info("[DB_SYNC][RESULT][SAVE] signalId={} | user={} | durationMs={}",
                    result.getId().getSignalId(), result.getId().getUserEmail(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][RESULT][SAVE][ERROR] signalId={} | user={} | error={}",
                    result.getId().getSignalId(), result.getId().getUserEmail(), e.getMessage(), e);
            storeFailedOperation("result:save:" + result.getId().getSignalId() + ":" + result.getId().getUserEmail(), result);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncDeletePollResults(Long signalId) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollResultRepository.deleteBySignalId(signalId);
            log.info("[DB_SYNC][RESULT][DELETE_ALL] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[DB_SYNC][RESULT][DELETE_ALL][ERROR] signalId={} | error={}", signalId, e.getMessage(), e);
            storeFailedOperation("result:delete_all:" + signalId, signalId);
            throw e;
        }
    }

    private void storeFailedOperation(String operationKey, Object data) {
        try {
            String key = cacheService.buildKey(FAILED_OPS, operationKey);
            cacheService.set(key, data, FAILED_OPS_TTL);
            log.warn("[DB_SYNC][FAILED_OP][STORED] key={}", key);
        } catch (Exception e) {
            log.error("[DB_SYNC][FAILED_OP][STORE_ERROR] operationKey={} | error={}", operationKey, e.getMessage());
        }
    }

    // TODO: Implement failed_ops:* key scanning for admin recovery endpoint
    public List<String> getFailedOperationKeys() {
        return List.of();
    }
}