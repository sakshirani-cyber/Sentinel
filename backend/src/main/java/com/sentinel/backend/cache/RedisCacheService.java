package com.sentinel.backend.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Service
@Slf4j
public class RedisCacheService {

    private final RedisTemplate<String, Object> masterTemplate;
    private final RedisTemplate<String, Object> slaveTemplate;
    private final ObjectMapper objectMapper;

    @Value("${cache.poll.ttl.minutes:60}")
    private long pollTtlMinutes;

    @Value("${cache.poll.results.ttl.minutes:5}")
    private long pollResultsTtlMinutes;

    @Value("${cache.sse.events.ttl.hours:24}")
    private long sseEventsTtlHours;

    public RedisCacheService(
            @Qualifier("redisMasterTemplate") RedisTemplate<String, Object> masterTemplate,
            @Qualifier("redisSlaveTemplate") RedisTemplate<String, Object> slaveTemplate,
            ObjectMapper objectMapper) {
        this.masterTemplate = masterTemplate;
        this.slaveTemplate = slaveTemplate;
        this.objectMapper = objectMapper;
    }

    public String buildKey(String prefix, String suffix) {
        return prefix + ":" + suffix;
    }

    public Duration getPollTtl() {
        return Duration.ofMinutes(pollTtlMinutes);
    }

    public Duration getPollResultsTtl() {
        return Duration.ofMinutes(pollResultsTtlMinutes);
    }

    public Duration getSseEventsTtl() {
        return Duration.ofHours(sseEventsTtlHours);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "setFallback")
    public void set(String key, Object value, Duration ttl) {
        long start = System.currentTimeMillis();
        if (ttl != null) {
            masterTemplate.opsForValue().set(key, value, ttl);
        } else {
            masterTemplate.opsForValue().set(key, value);
        }
        log.debug("[CACHE][WRITE] operation=SET | key={} | durationMs={}", key, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hSetFallback")
    public void hSet(String key, String field, Object value) {
        long start = System.currentTimeMillis();
        masterTemplate.opsForHash().put(key, field, value);
        log.debug("[CACHE][WRITE] operation=HSET | key={} | field={} | durationMs={}", key, field, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hSetAllFallback")
    public void hSetAll(String key, Map<String, Object> values, Duration ttl) {
        long start = System.currentTimeMillis();
        masterTemplate.opsForHash().putAll(key, values);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
        log.debug("[CACHE][WRITE] operation=HSET_ALL | key={} | fieldCount={} | durationMs={}", key, values.size(), System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "incrFallback")
    public Long incr(String key) {
        long start = System.currentTimeMillis();
        Long result = masterTemplate.opsForValue().increment(key);
        log.debug("[CACHE][WRITE] operation=INCR | key={} | newValue={} | durationMs={}", key, result, System.currentTimeMillis() - start);
        return result;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "addToSortedSetFallback")
    public void addToSortedSet(String key, Object value, double score, Duration ttl) {
        long start = System.currentTimeMillis();
        masterTemplate.opsForZSet().add(key, value, score);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
        log.debug("[CACHE][WRITE] operation=ZADD | key={} | durationMs={}", key, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "deleteFallback")
    public void delete(String key) {
        long start = System.currentTimeMillis();
        masterTemplate.delete(key);
        log.debug("[CACHE][DELETE] key={} | durationMs={}", key, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "leftPushFallback")
    public void leftPush(String key, Object value, Duration ttl) {
        long start = System.currentTimeMillis();
        masterTemplate.opsForList().leftPush(key, value);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
        log.debug("[CACHE][WRITE] operation=LPUSH | key={} | durationMs={}", key, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getFallback")
    public <T> T get(String key, Class<T> clazz) {
        long start = System.currentTimeMillis();
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            log.debug("[CACHE][READ] operation=GET | key={} | result=MISS | durationMs={}", key, System.currentTimeMillis() - start);
            return null;
        }
        log.debug("[CACHE][READ] operation=GET | key={} | result=HIT | durationMs={}", key, System.currentTimeMillis() - start);
        return objectMapper.convertValue(value, clazz);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getTypeRefFallback")
    public <T> T get(String key, TypeReference<T> typeRef) {
        long start = System.currentTimeMillis();
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            log.debug("[CACHE][READ] operation=GET | key={} | result=MISS | durationMs={}", key, System.currentTimeMillis() - start);
            return null;
        }
        log.debug("[CACHE][READ] operation=GET | key={} | result=HIT | durationMs={}", key, System.currentTimeMillis() - start);
        return objectMapper.convertValue(value, typeRef);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hGetAllFallback")
    public Map<String, Object> hGetAll(String key) {
        long start = System.currentTimeMillis();
        Map<Object, Object> rawMap = slaveTemplate.opsForHash().entries(key);
        if (rawMap == null || rawMap.isEmpty()) {
            log.debug("[CACHE][READ] operation=HGETALL | key={} | result=MISS | durationMs={}", key, System.currentTimeMillis() - start);
            return Map.of();
        }

        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
            result.put(entry.getKey().toString(), entry.getValue());
        }
        log.debug("[CACHE][READ] operation=HGETALL | key={} | result=HIT | fieldCount={} | durationMs={}", key, result.size(), System.currentTimeMillis() - start);
        return result;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getListTypeRefFallback")
    public <T> List<T> getList(String key, TypeReference<List<T>> typeRef) {
        long start = System.currentTimeMillis();
        List<Object> rawList = slaveTemplate.opsForList().range(key, 0, -1);
        if (rawList == null || rawList.isEmpty()) {
            log.debug("[CACHE][READ] operation=LRANGE | key={} | result=MISS | durationMs={}", key, System.currentTimeMillis() - start);
            return new ArrayList<>();
        }

        log.debug("[CACHE][READ] operation=LRANGE | key={} | result=HIT | count={} | durationMs={}", key, rawList.size(), System.currentTimeMillis() - start);
        return objectMapper.convertValue(rawList, typeRef);
    }

    private void setFallback(String key, Object value, Duration ttl, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=SET | key={} | error={}", key, e.getMessage());
    }

    private void hSetFallback(String key, String field, Object value, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=HSET | key={} | field={} | error={}", key, field, e.getMessage());
    }

    private void hSetAllFallback(String key, Map<String, Object> values, Duration ttl, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=HSET_ALL | key={} | error={}", key, e.getMessage());
    }

    private Long incrFallback(String key, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=INCR | key={} | error={}", key, e.getMessage());
        return null;
    }

    private void addToSortedSetFallback(String key, Object value, double score, Duration ttl, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=ZADD | key={} | error={}", key, e.getMessage());
    }

    private void deleteFallback(String key, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=DELETE | key={} | error={}", key, e.getMessage());
    }

    private void leftPushFallback(String key, Object value, Duration ttl, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=LPUSH | key={} | error={}", key, e.getMessage());
    }

    private <T> T getFallback(String key, Class<T> clazz, Exception e) {
        log.warn("[REDIS][READ_FALLBACK] operation=GET | key={} | error={}", key, e.getMessage());
        return tryReadFromMaster(key, clazz);
    }

    private <T> T getTypeRefFallback(String key, TypeReference<T> typeRef, Exception e) {
        log.warn("[REDIS][READ_FALLBACK] operation=GET | key={} | error={}", key, e.getMessage());
        return tryReadFromMasterTypeRef(key, typeRef);
    }

    private Map<String, Object> hGetAllFallback(String key, Exception e) {
        log.warn("[REDIS][READ_FALLBACK] operation=HGETALL | key={} | error={}", key, e.getMessage());
        return tryReadHashFromMaster(key);
    }

    private <T> List<T> getListTypeRefFallback(String key, TypeReference<List<T>> typeRef, Exception e) {
        log.warn("[REDIS][READ_FALLBACK] operation=LRANGE | key={} | error={}", key, e.getMessage());
        return tryReadListFromMasterTypeRef(key, typeRef);
    }

    private <T> T tryReadFromMaster(String key, Class<T> clazz) {
        try {
            Object value = masterTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            return objectMapper.convertValue(value, clazz);
        } catch (Exception ex) {
            log.error("[REDIS][MASTER_FALLBACK_FAILED] operation=GET | key={} | error={}", key, ex.getMessage());
            return null;
        }
    }

    private <T> T tryReadFromMasterTypeRef(String key, TypeReference<T> typeRef) {
        try {
            Object value = masterTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            return objectMapper.convertValue(value, typeRef);
        } catch (Exception ex) {
            log.error("[REDIS][MASTER_FALLBACK_FAILED] operation=GET | key={} | error={}", key, ex.getMessage());
            return null;
        }
    }

    private Map<String, Object> tryReadHashFromMaster(String key) {
        try {
            Map<Object, Object> rawMap = masterTemplate.opsForHash().entries(key);
            if (rawMap == null || rawMap.isEmpty()) {
                return Map.of();
            }

            Map<String, Object> result = new HashMap<>();
            for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
                result.put(entry.getKey().toString(), entry.getValue());
            }
            return result;
        } catch (Exception ex) {
            log.error("[REDIS][MASTER_FALLBACK_FAILED] operation=HGETALL | key={} | error={}", key, ex.getMessage());
            return Map.of();
        }
    }

    private <T> List<T> tryReadListFromMasterTypeRef(String key, TypeReference<List<T>> typeRef) {
        try {
            List<Object> rawList = masterTemplate.opsForList().range(key, 0, -1);
            if (rawList == null || rawList.isEmpty()) {
                return new ArrayList<>();
            }
            return objectMapper.convertValue(rawList, typeRef);
        } catch (Exception ex) {
            log.error("[REDIS][MASTER_FALLBACK_FAILED] operation=LRANGE | key={} | error={}", key, ex.getMessage());
            return new ArrayList<>();
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "executePipelineFallback")
    public List<Object> executePipeline(Consumer<PipelineOperations> operations) {
        long start = System.currentTimeMillis();
        
        PipelineOperations pipelineOps = new PipelineOperations();
        operations.accept(pipelineOps);
        
        List<Object> results = masterTemplate.executePipelined(new SessionCallback<>() {
            @Override
            @SuppressWarnings("unchecked")
            public Object execute(RedisOperations ops) throws DataAccessException {
                for (PipelineCommand cmd : pipelineOps.getCommands()) {
                    cmd.execute(ops);
                }
                return null; // Results are collected by executePipelined
            }
        });
        
        log.debug("[CACHE][PIPELINE] operations={} | durationMs={}", 
                pipelineOps.getCommands().size(), System.currentTimeMillis() - start);
        
        return results;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "pipelinedVoteSubmitFallback")
    public void pipelinedVoteSubmit(String voteKey, String userEmail, Map<String, Object> voteData, String invalidateKey) {
        long start = System.currentTimeMillis();
        
        masterTemplate.executePipelined(new SessionCallback<>() {
            @Override
            @SuppressWarnings("unchecked")
            public Object execute(RedisOperations ops) throws DataAccessException {
                ops.opsForHash().put(voteKey, userEmail, voteData);
                ops.delete(invalidateKey);
                return null;
            }
        });
        
        log.debug("[CACHE][PIPELINE_VOTE] voteKey={} | user={} | durationMs={}", 
                voteKey, userEmail, System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "pipelinedPollCreateFallback")
    public void pipelinedPollCreate(String pollKey, Map<String, Object> pollData, Duration ttl, 
                                     List<UserPollEntry> userPollsEntries) {
        long start = System.currentTimeMillis();
        
        masterTemplate.executePipelined(new SessionCallback<>() {
            @Override
            @SuppressWarnings("unchecked")
            public Object execute(RedisOperations ops) throws DataAccessException {
                ops.opsForHash().putAll(pollKey, pollData);

                if (ttl != null) {
                    ops.expire(pollKey, ttl);
                }

                for (UserPollEntry entry : userPollsEntries) {
                    ops.opsForZSet().add(entry.userKey(), entry.signalId(), entry.score());
                    if (ttl != null) {
                        ops.expire(entry.userKey(), ttl);
                    }
                }
                
                return null;
            }
        });
        
        log.debug("[CACHE][PIPELINE_POLL_CREATE] pollKey={} | userCount={} | durationMs={}", 
                pollKey, userPollsEntries.size(), System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "pipelinedDeleteFallback")
    public void pipelinedDelete(List<String> keysToDelete) {
        if (keysToDelete == null || keysToDelete.isEmpty()) {
            return;
        }
        
        long start = System.currentTimeMillis();
        
        masterTemplate.executePipelined(new SessionCallback<>() {
            @Override
            @SuppressWarnings("unchecked")
            public Object execute(RedisOperations ops) throws DataAccessException {
                for (String key : keysToDelete) {
                    ops.delete(key);
                }
                return null;
            }
        });
        
        log.debug("[CACHE][PIPELINE_DELETE] keyCount={} | durationMs={}", 
                keysToDelete.size(), System.currentTimeMillis() - start);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "pipelinedHGetAllFallback")
    public List<Map<String, Object>> pipelinedHGetAll(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return new ArrayList<>();
        }
        
        long start = System.currentTimeMillis();
        
        List<Object> results = slaveTemplate.executePipelined(new SessionCallback<>() {
            @Override
            @SuppressWarnings("unchecked")
            public Object execute(RedisOperations ops) throws DataAccessException {
                for (String key : keys) {
                    ops.opsForHash().entries(key);
                }
                return null;
            }
        });
        
        List<Map<String, Object>> typedResults = new ArrayList<>(results.size());
        for (Object result : results) {
            if (result instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<Object, Object> rawMap = (Map<Object, Object>) result;
                Map<String, Object> converted = new HashMap<>();
                for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
                    converted.put(entry.getKey().toString(), entry.getValue());
                }
                typedResults.add(converted);
            } else {
                typedResults.add(Map.of());
            }
        }
        
        log.debug("[CACHE][PIPELINE_HGETALL] keyCount={} | durationMs={}", 
                keys.size(), System.currentTimeMillis() - start);
        
        return typedResults;
    }

    @SuppressWarnings("unused")
    private List<Object> executePipelineFallback(Consumer<PipelineOperations> operations, Exception e) {
        log.warn("[REDIS][PIPELINE_FALLBACK] error={}", e.getMessage());
        return new ArrayList<>();
    }

    @SuppressWarnings("unused")
    private void pipelinedVoteSubmitFallback(String voteKey, String userEmail, 
            Map<String, Object> voteData, String invalidateKey, Exception e) {
        log.warn("[REDIS][PIPELINE_VOTE_FALLBACK] Falling back to sequential | voteKey={} | error={}", 
                voteKey, e.getMessage());
        try {
            hSet(voteKey, userEmail, voteData);
            delete(invalidateKey);
        } catch (Exception ex) {
            log.error("[REDIS][PIPELINE_VOTE_FALLBACK_FAILED] error={}", ex.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private void pipelinedPollCreateFallback(String pollKey, Map<String, Object> pollData, 
            Duration ttl, List<UserPollEntry> userPollsEntries, Exception e) {
        log.warn("[REDIS][PIPELINE_POLL_CREATE_FALLBACK] Falling back to sequential | pollKey={} | error={}", 
                pollKey, e.getMessage());
        try {
            hSetAll(pollKey, pollData, ttl);
            for (UserPollEntry entry : userPollsEntries) {
                addToSortedSet(entry.userKey(), entry.signalId(), entry.score(), ttl);
            }
        } catch (Exception ex) {
            log.error("[REDIS][PIPELINE_POLL_CREATE_FALLBACK_FAILED] error={}", ex.getMessage());
        }
    }

    @SuppressWarnings("unused")
    private void pipelinedDeleteFallback(List<String> keysToDelete, Exception e) {
        log.warn("[REDIS][PIPELINE_DELETE_FALLBACK] Falling back to sequential | keyCount={} | error={}", 
                keysToDelete.size(), e.getMessage());
        for (String key : keysToDelete) {
            try {
                delete(key);
            } catch (Exception ex) {
                log.error("[REDIS][PIPELINE_DELETE_FALLBACK_FAILED] key={} | error={}", key, ex.getMessage());
            }
        }
    }

    @SuppressWarnings("unused")
    private List<Map<String, Object>> pipelinedHGetAllFallback(List<String> keys, Exception e) {
        log.warn("[REDIS][PIPELINE_HGETALL_FALLBACK] Falling back to sequential | keyCount={} | error={}", 
                keys.size(), e.getMessage());
        List<Map<String, Object>> results = new ArrayList<>();
        for (String key : keys) {
            try {
                results.add(hGetAll(key));
            } catch (Exception ex) {
                log.error("[REDIS][PIPELINE_HGETALL_FALLBACK_FAILED] key={} | error={}", key, ex.getMessage());
                results.add(Map.of());
            }
        }
        return results;
    }

    public record UserPollEntry(String userKey, Long signalId, double score) {}

    public static class PipelineOperations {
        private final List<PipelineCommand> commands = new ArrayList<>();

        public void set(String key, Object value, Duration ttl) {
            commands.add(ops -> {
                if (ttl != null) {
                    ops.opsForValue().set(key, value, ttl);
                } else {
                    ops.opsForValue().set(key, value);
                }
            });
        }

        public void hSet(String key, String field, Object value) {
            commands.add(ops -> ops.opsForHash().put(key, field, value));
        }

        public void hSetAll(String key, Map<String, Object> values) {
            commands.add(ops -> ops.opsForHash().putAll(key, values));
        }

        public void delete(String key) {
            commands.add(ops -> ops.delete(key));
        }

        public void expire(String key, Duration ttl) {
            commands.add(ops -> ops.expire(key, ttl));
        }

        public void zadd(String key, Object value, double score) {
            commands.add(ops -> ops.opsForZSet().add(key, value, score));
        }

        List<PipelineCommand> getCommands() {
            return commands;
        }
    }

    @FunctionalInterface
    private interface PipelineCommand {
        @SuppressWarnings("rawtypes")
        void execute(RedisOperations ops);
    }
}
