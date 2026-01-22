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

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncDbSyncService {

    private final SignalRepository signalRepository;
    private final PollRepository pollRepository;
    private final PollResultRepository pollResultRepository;
    private final RedisCacheService cacheService;

    @Value("${async.db.sync.enabled:true}")
    private boolean syncEnabled;

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncSaveSignal(Signal signal) {
        if (!syncEnabled) {
            log.debug("[ASYNC_DB] Sync disabled, skipping signal save");
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            signalRepository.save(signal);
            log.info("[ASYNC_DB][SIGNAL][SAVE] signalId={} | durationMs={}",
                    signal.getId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][SIGNAL][SAVE][ERROR] signalId={} | error={}",
                    signal.getId(), e.getMessage(), e);
            storeFailedOperation("signal:save:" + signal.getId(), signal);
            throw e;
        }
    }

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
            log.info("[ASYNC_DB][SIGNAL][UPDATE] signalId={} | durationMs={}",
                    signal.getId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][SIGNAL][UPDATE][ERROR] signalId={} | error={}",
                    signal.getId(), e.getMessage(), e);
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
            signalRepository.updateSignalStatus(signalId, "DELETED");
            log.info("[ASYNC_DB][SIGNAL][DELETE] signalId={} | durationMs={}",
                    signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][SIGNAL][DELETE][ERROR] signalId={} | error={}",
                    signalId, e.getMessage(), e);
            storeFailedOperation("signal:delete:" + signalId, signalId);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncSavePoll(Poll poll) {
        if (!syncEnabled) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollRepository.save(poll);
            log.info("[ASYNC_DB][POLL][SAVE] signalId={} | durationMs={}",
                    poll.getSignalId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][POLL][SAVE][ERROR] signalId={} | error={}",
                    poll.getSignalId(), e.getMessage(), e);
            storeFailedOperation("poll:save:" + poll.getSignalId(), poll);
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
            log.info("[ASYNC_DB][POLL][UPDATE] signalId={} | durationMs={}",
                    poll.getSignalId(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][POLL][UPDATE][ERROR] signalId={} | error={}",
                    poll.getSignalId(), e.getMessage(), e);
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
            log.info("[ASYNC_DB][POLL][DELETE] signalId={} | durationMs={}",
                    signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][POLL][DELETE][ERROR] signalId={} | error={}",
                    signalId, e.getMessage(), e);
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
            log.info("[ASYNC_DB][RESULT][SAVE] signalId={} | user={} | durationMs={}",
                    result.getId().getSignalId(),
                    result.getId().getUserEmail(),
                    System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][RESULT][SAVE][ERROR] signalId={} | user={} | error={}",
                    result.getId().getSignalId(),
                    result.getId().getUserEmail(),
                    e.getMessage(), e);
            storeFailedOperation(
                    "result:save:" + result.getId().getSignalId() + ":" + result.getId().getUserEmail(),
                    result
            );
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
            log.info("[ASYNC_DB][RESULT][DELETE_ALL] signalId={} | durationMs={}",
                    signalId, System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][RESULT][DELETE_ALL][ERROR] signalId={} | error={}",
                    signalId, e.getMessage(), e);
            storeFailedOperation("result:delete_all:" + signalId, signalId);
            throw e;
        }
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncBatchSavePollResults(List<PollResult> results) {
        if (!syncEnabled || results.isEmpty()) {
            return CompletableFuture.completedFuture(null);
        }

        try {
            long start = System.currentTimeMillis();
            pollResultRepository.saveAll(results);
            log.info("[ASYNC_DB][RESULT][BATCH_SAVE] count={} | durationMs={}",
                    results.size(), System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[ASYNC_DB][RESULT][BATCH_SAVE][ERROR] count={} | error={}",
                    results.size(), e.getMessage(), e);
            storeFailedOperation("result:batch_save:" + System.currentTimeMillis(), results);
            throw e;
        }
    }

    private void storeFailedOperation(String operationKey, Object data) {
        try {
            String key = cacheService.buildKey("failed_ops", operationKey);
            cacheService.set(key, data, java.time.Duration.ofHours(24));
            log.warn("[ASYNC_DB][FAILURE][STORED] key={} | Manual recovery required", key);
        } catch (Exception e) {
            log.error("[ASYNC_DB][FAILURE][STORE_ERROR] Could not store failed operation: {}",
                    e.getMessage());
        }
    }

    // Manual recovery endpoint can fetch and retry these operations
    public List<String> getFailedOperationKeys() {
        // Implementation to scan failed_ops:* keys
        // This would be called by admin endpoint for manual recovery
        return List.of();
    }
}