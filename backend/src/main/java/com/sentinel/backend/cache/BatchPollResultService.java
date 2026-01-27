package com.sentinel.backend.cache;

import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.PollResultId;
import com.sentinel.backend.entity.Signal;
import com.sentinel.backend.repository.PollResultRepository;
import com.sentinel.backend.repository.SignalRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BatchPollResultService {

    private final PollResultRepository pollResultRepository;
    private final SignalRepository signalRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private final ScheduledExecutorService scheduler;
    private final AtomicBoolean isShuttingDown;
    private final AtomicLong totalBatched;
    private final AtomicLong totalFlushed;

    private static final String PENDING_BATCH_KEY = "batch:pending:poll_results";
    private static final String PENDING_BATCH_DATA_PREFIX = "batch:pending:data:";
    private static final Duration PENDING_TTL = Duration.ofHours(24);

    @Value("${batch.poll-result.size:100}")
    private int batchSize;

    @Value("${batch.poll-result.timeout-ms:500}")
    private long batchTimeoutMs;

    @Value("${async.db.sync.enabled:true}")
    private boolean syncEnabled;

    public BatchPollResultService(
            PollResultRepository pollResultRepository,
            SignalRepository signalRepository,
            @Qualifier("redisMasterTemplate") RedisTemplate<String, Object> redisTemplate) {
        this.pollResultRepository = pollResultRepository;
        this.signalRepository = signalRepository;
        this.redisTemplate = redisTemplate;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "batch-flush-scheduler");
            t.setDaemon(true);
            return t;
        });
        this.isShuttingDown = new AtomicBoolean(false);
        this.totalBatched = new AtomicLong(0);
        this.totalFlushed = new AtomicLong(0);
    }

    @PostConstruct
    public void init() {
        log.info("[BATCH][INIT] BatchPollResultService initializing | batchSize={} | timeoutMs={}",
                batchSize, batchTimeoutMs);
        
        recoverPendingItems();
        
        scheduler.scheduleAtFixedRate(
                this::flushIfNeeded,
                batchTimeoutMs,
                batchTimeoutMs,
                TimeUnit.MILLISECONDS
        );
        
        log.info("[BATCH][INIT] BatchPollResultService ready | using Redis-backed durable queue");
    }

    @PreDestroy
    public void shutdown() {
        isShuttingDown.set(true);
        log.info("[BATCH][SHUTDOWN] Starting graceful shutdown | pendingItems={}", getPendingCount());
        
        flushAll();
        
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(30, TimeUnit.SECONDS)) {
                log.warn("[BATCH][SHUTDOWN] Timeout waiting for flush, forcing shutdown");
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        long remaining = getPendingCount();
        if (remaining > 0) {
            log.warn("[BATCH][SHUTDOWN] {} items still pending in Redis - will recover on next startup", remaining);
        } else {
            log.info("[BATCH][SHUTDOWN] Complete | totalBatched={} | totalFlushed={}",
                    totalBatched.get(), totalFlushed.get());
        }
    }

    private void recoverPendingItems() {
        try {
            Long pendingCount = redisTemplate.opsForSet().size(PENDING_BATCH_KEY);
            if (pendingCount == null || pendingCount == 0) {
                log.info("[BATCH][RECOVERY] No pending items to recover");
                return;
            }
            
            log.warn("[BATCH][RECOVERY] Found {} pending items from previous run - recovering...", pendingCount);
            
            flushAll();
            
            log.info("[BATCH][RECOVERY] Recovery complete");
        } catch (Exception e) {
            log.error("[BATCH][RECOVERY] Error during recovery: {} - items remain in Redis for next attempt", 
                    e.getMessage());
        }
    }

    public CompletableFuture<Void> queueForBatchInsert(PollResult result) {
        if (!syncEnabled) {
            log.debug("[BATCH][SKIP] Sync disabled");
            return CompletableFuture.completedFuture(null);
        }

        try {
            String itemKey = result.getId().getSignalId() + ":" + result.getId().getUserEmail();
            String dataKey = PENDING_BATCH_DATA_PREFIX + itemKey;
            Map<String, Object> voteData = Map.of(
                    "signalId", result.getId().getSignalId(),
                    "userEmail", result.getId().getUserEmail(),
                    "selectedOption", result.getSelectedOption() != null ? result.getSelectedOption() : "",
                    "defaultResponse", result.getDefaultResponse() != null ? result.getDefaultResponse() : "",
                    "reason", result.getReason() != null ? result.getReason() : "",
                    "timeOfSubmission", result.getTimeOfSubmission().toString()
            );
            
            redisTemplate.opsForValue().set(dataKey, voteData, PENDING_TTL);
            
            redisTemplate.opsForSet().add(PENDING_BATCH_KEY, itemKey);
            redisTemplate.expire(PENDING_BATCH_KEY, PENDING_TTL);
            
            totalBatched.incrementAndGet();
            long count = getPendingCount();
            
            log.debug("[BATCH][QUEUE] signalId={} | user={} | pendingCount={} | durable=true",
                    result.getId().getSignalId(), result.getId().getUserEmail(), count);
            
            if (count >= batchSize) {
                scheduler.execute(this::flushBatch);
            }
            
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[BATCH][QUEUE_ERROR] signalId={} | user={} | error={} - falling back to immediate save",
                    result.getId().getSignalId(), result.getId().getUserEmail(), e.getMessage());
            return asyncSaveSingleResult(result);
        }
    }

    public long getPendingCount() {
        try {
            Long size = redisTemplate.opsForSet().size(PENDING_BATCH_KEY);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.warn("[BATCH][COUNT_ERROR] {}", e.getMessage());
            return 0;
        }
    }

    private void flushIfNeeded() {
        if (getPendingCount() > 0) {
            flushBatch();
        }
    }

    private void flushAll() {
        int attempts = 0;
        while (getPendingCount() > 0 && attempts < 100) {
            flushBatch();
            attempts++;
        }
    }

    private synchronized void flushBatch() {
        try {
            Set<Object> itemKeys = redisTemplate.opsForSet().members(PENDING_BATCH_KEY);
            if (itemKeys == null || itemKeys.isEmpty()) {
                return;
            }
            
            List<String> keysToProcess = itemKeys.stream()
                    .map(Object::toString)
                    .limit(batchSize)
                    .toList();
            
            if (keysToProcess.isEmpty()) {
                return;
            }
            
            if (log.isDebugEnabled()) {
                log.debug("[BATCH][FLUSH_START] batchSize={}", keysToProcess.size());
            }
            
            // OPTIMIZATION: Collect all vote data first
            List<Map<String, Object>> allVoteData = new ArrayList<>(keysToProcess.size());
            List<String> processedKeys = new ArrayList<>(keysToProcess.size());
            Set<Long> signalIds = new HashSet<>();
            
            for (String itemKey : keysToProcess) {
                try {
                    String dataKey = PENDING_BATCH_DATA_PREFIX + itemKey;
                    @SuppressWarnings("unchecked")
                    Map<String, Object> voteData = (Map<String, Object>) redisTemplate.opsForValue().get(dataKey);
                    
                    if (voteData != null) {
                        allVoteData.add(voteData);
                        processedKeys.add(itemKey);
                        signalIds.add(((Number) voteData.get("signalId")).longValue());
                    } else {
                        processedKeys.add(itemKey);
                    }
                } catch (Exception e) {
                    log.warn("[BATCH][LOAD_ERROR] itemKey={} | error={}", itemKey, e.getMessage());
                }
            }
            
            if (allVoteData.isEmpty()) {
                for (String key : processedKeys) {
                    redisTemplate.opsForSet().remove(PENDING_BATCH_KEY, key);
                }
                return;
            }
            
            // OPTIMIZATION: Batch load all signals in ONE DB call instead of N calls
            Map<Long, Signal> signalMap = signalRepository.findAllById(signalIds)
                    .stream()
                    .collect(Collectors.toMap(Signal::getId, s -> s));
            
            if (log.isDebugEnabled()) {
                log.debug("[BATCH][SIGNALS_LOADED] signalCount={} | uniqueSignalIds={}", 
                        signalMap.size(), signalIds.size());
            }
            
            // Reconstruct PollResults using the pre-loaded signal map
            List<PollResult> batch = new ArrayList<>(allVoteData.size());
            for (Map<String, Object> voteData : allVoteData) {
                PollResult result = reconstructPollResultOptimized(voteData, signalMap);
                if (result != null) {
                    batch.add(result);
                }
            }
            
            if (batch.isEmpty()) {
                for (String key : processedKeys) {
                    redisTemplate.opsForSet().remove(PENDING_BATCH_KEY, key);
                }
                return;
            }
            
            executeBatchInsert(batch);
            
            for (String itemKey : processedKeys) {
                redisTemplate.opsForSet().remove(PENDING_BATCH_KEY, itemKey);
                redisTemplate.delete(PENDING_BATCH_DATA_PREFIX + itemKey);
            }
            
            totalFlushed.addAndGet(batch.size());
            log.info("[BATCH][FLUSH_SUCCESS] inserted={} | totalFlushed={} | remainingPending={}",
                    batch.size(), totalFlushed.get(), getPendingCount());
            
        } catch (Exception e) {
            log.error("[BATCH][FLUSH_ERROR] error={} - items remain in Redis for retry", e.getMessage(), e);
        }
    }

    /**
     * OPTIMIZATION: Reconstructs PollResult using pre-loaded signal map.
     * Eliminates N+1 query problem - signals are batch-loaded once.
     */
    private PollResult reconstructPollResultOptimized(Map<String, Object> voteData, Map<Long, Signal> signalMap) {
        try {
            Long signalId = ((Number) voteData.get("signalId")).longValue();
            String userEmail = (String) voteData.get("userEmail");
            
            Signal signal = signalMap.get(signalId);
            if (signal == null) {
                log.warn("[BATCH][RECONSTRUCT] Signal not in batch: {}", signalId);
                return null;
            }
            
            PollResult result = new PollResult();
            result.setId(new PollResultId(signalId, userEmail));
            result.setSignal(signal);
            
            String selectedOption = (String) voteData.get("selectedOption");
            result.setSelectedOption(selectedOption.isEmpty() ? null : selectedOption);
            
            String defaultResponse = (String) voteData.get("defaultResponse");
            result.setDefaultResponse(defaultResponse.isEmpty() ? null : defaultResponse);
            
            String reason = (String) voteData.get("reason");
            result.setReason(reason.isEmpty() ? null : reason);
            
            String timeStr = (String) voteData.get("timeOfSubmission");
            result.setTimeOfSubmission(Instant.parse(timeStr));
            
            return result;
        } catch (Exception e) {
            log.error("[BATCH][RECONSTRUCT_ERROR] error={}", e.getMessage());
            return null;
        }
    }

    // REMOVED: reconstructPollResult - replaced by reconstructPollResultOptimized (no N+1 query)

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database", fallbackMethod = "batchInsertFallback")
    @Retry(name = "database")
    public void executeBatchInsert(List<PollResult> results) {
        if (results.isEmpty()) {
            return;
        }

        long start = System.currentTimeMillis();
        
        pollResultRepository.saveAll(results);
        
        long duration = System.currentTimeMillis() - start;
        double throughput = duration > 0 ? results.size() / (duration / 1000.0) : results.size();
        
        log.info("[BATCH][DB_SYNC] count={} | durationMs={} | throughput={}/sec",
                results.size(), duration, String.format("%.2f", throughput));
    }

    @Async("asyncExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @CircuitBreaker(name = "database")
    @Retry(name = "database")
    public CompletableFuture<Void> asyncSaveSingleResult(PollResult result) {
        try {
            long start = System.currentTimeMillis();
            pollResultRepository.save(result);
            log.info("[BATCH][SINGLE_SAVE] signalId={} | user={} | durationMs={}",
                    result.getId().getSignalId(), result.getId().getUserEmail(),
                    System.currentTimeMillis() - start);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("[BATCH][SINGLE_SAVE_ERROR] signalId={} | user={} | error={}",
                    result.getId().getSignalId(), result.getId().getUserEmail(), e.getMessage(), e);
            throw e;
        }
    }

    @SuppressWarnings("unused")
    private void batchInsertFallback(List<PollResult> results, Exception e) {
        log.warn("[BATCH][FALLBACK] Circuit breaker triggered | batchSize={} | error={} | items remain in Redis",
                results.size(), e.getMessage());
    }


    public long getTotalBatched() {
        return totalBatched.get();
    }

    public long getTotalFlushed() {
        return totalFlushed.get();
    }
}
