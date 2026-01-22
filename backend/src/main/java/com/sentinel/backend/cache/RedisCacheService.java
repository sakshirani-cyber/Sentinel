package com.sentinel.backend.cache;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class RedisCacheService {

    private final RedisTemplate<String, Object> masterTemplate;
    private final RedisTemplate<String, Object> slaveTemplate;
    private final ObjectMapper objectMapper;

    public RedisCacheService(
            @Qualifier("redisMasterTemplate") RedisTemplate<String, Object> masterTemplate,
            @Qualifier("redisSlaveTemplate") RedisTemplate<String, Object> slaveTemplate,
            ObjectMapper objectMapper) {
        this.masterTemplate = masterTemplate;
        this.slaveTemplate = slaveTemplate;
        this.objectMapper = objectMapper;
    }

    @Value("${cache.poll.ttl.minutes:60}")
    private long pollTtlMinutes;

    @Value("${cache.poll.results.ttl.minutes:5}")
    private long pollResultsTtlMinutes;

    @Value("${cache.sse.events.ttl.hours:24}")
    private long sseEventsTtlHours;

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

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackSet")
    public void set(String key, Object value, Duration ttl) {
        if (ttl != null) {
            masterTemplate.opsForValue().set(key, value, ttl);
        } else {
            masterTemplate.opsForValue().set(key, value);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackHSet")
    public void hSet(String key, String field, Object value) {
        masterTemplate.opsForHash().put(key, field, value);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackHSetAll")
    public void hSetAll(String key, Map<String, Object> values, Duration ttl) {
        masterTemplate.opsForHash().putAll(key, values);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackIncr")
    public Long incr(String key) {
        return masterTemplate.opsForValue().increment(key);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackZAdd")
    public void addToSortedSet(String key, Object value, double score, Duration ttl) {
        masterTemplate.opsForZSet().add(key, value, score);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackDelete")
    public void delete(String key) {
        masterTemplate.delete(key);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackDeleteMulti")
    public void deleteMultiple(Collection<String> keys) {
        if (keys != null && !keys.isEmpty()) {
            masterTemplate.delete(keys);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackLeftPush")
    public void leftPush(String key, Object value, Duration ttl) {
        masterTemplate.opsForList().leftPush(key, value);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "readFallbackGet")
    public <T> T get(String key, Class<T> clazz) {
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, clazz);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "readFallbackGetTypeRef")
    public <T> T get(String key, TypeReference<T> typeRef) {
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, typeRef);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "readFallbackHGetAll")
    public Map<String, Object> hGetAll(String key) {
        Map<Object, Object> rawMap = slaveTemplate.opsForHash().entries(key);
        if (rawMap == null || rawMap.isEmpty()) {
            return Map.of();
        }
        
        Map<String, Object> result = new java.util.HashMap<>();
        for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
            result.put(entry.getKey().toString(), entry.getValue());
        }
        return result;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "readFallbackGetList")
    public <T> List<T> getList(String key, Class<T> clazz) {
        List<Object> rawList = slaveTemplate.opsForList().range(key, 0, -1);
        if (rawList == null || rawList.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<T> result = new ArrayList<>();
        for (Object item : rawList) {
            if (item != null) {
                result.add(objectMapper.convertValue(item, clazz));
            }
        }
        return result;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "readFallbackGetListTypeRef")
    public <T> List<T> getList(String key, TypeReference<List<T>> typeRef) {
        List<Object> rawList = slaveTemplate.opsForList().range(key, 0, -1);
        if (rawList == null || rawList.isEmpty()) {
            return new ArrayList<>();
        }
        
        return objectMapper.convertValue(rawList, typeRef);
    }

    private void writeFallbackSet(String key, Object value, Duration ttl, Exception e) {
        log.warn("[REDIS][FALLBACK][SET] key={} | error={}", key, e.getMessage());
    }

    private void writeFallbackHSet(String key, String field, Object value, Exception e) {
        log.warn("[REDIS][FALLBACK][HSET] key={} | field={} | error={}", key, field, e.getMessage());
    }

    private void writeFallbackHSetAll(String key, Map<String, Object> values, Duration ttl, Exception e) {
        log.warn("[REDIS][FALLBACK][HSET_ALL] key={} | error={}", key, e.getMessage());
    }

    private Long writeFallbackIncr(String key, Exception e) {
        log.warn("[REDIS][FALLBACK][INCR] key={} | error={}", key, e.getMessage());
        return null;
    }

    private void writeFallbackZAdd(String key, Object value, double score, Duration ttl, Exception e) {
        log.warn("[REDIS][FALLBACK][ZADD] key={} | error={}", key, e.getMessage());
    }

    private void writeFallbackDelete(String key, Exception e) {
        log.warn("[REDIS][FALLBACK][DELETE] key={} | error={}", key, e.getMessage());
    }

    private void writeFallbackDeleteMulti(Collection<String> keys, Exception e) {
        log.warn("[REDIS][FALLBACK][DELETE_MULTI] count={} | error={}", 
                keys != null ? keys.size() : 0, e.getMessage());
    }

    private void writeFallbackLeftPush(String key, Object value, Duration ttl, Exception e) {
        log.warn("[REDIS][FALLBACK][LEFT_PUSH] key={} | error={}", key, e.getMessage());
    }

    private <T> T readFallbackGet(String key, Class<T> clazz, Exception e) {
        log.warn("[REDIS][FALLBACK][GET] key={} | error={}", key, e.getMessage());
        // Fallback to master if slave fails
        try {
            Object value = masterTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            return objectMapper.convertValue(value, clazz);
        } catch (Exception ex) {
            log.error("[REDIS][FALLBACK][GET][MASTER_FAIL] key={} | error={}", key, ex.getMessage());
            return null;
        }
    }

    private <T> T readFallbackGetTypeRef(String key, TypeReference<T> typeRef, Exception e) {
        log.warn("[REDIS][FALLBACK][GET_TYPEREF] key={} | error={}", key, e.getMessage());

        try {
            Object value = masterTemplate.opsForValue().get(key);
            if (value == null) {
                return null;
            }
            return objectMapper.convertValue(value, typeRef);
        } catch (Exception ex) {
            log.error("[REDIS][FALLBACK][GET_TYPEREF][MASTER_FAIL] key={} | error={}", key, ex.getMessage());
            return null;
        }
    }

    private Map<String, Object> readFallbackHGetAll(String key, Exception e) {
        log.warn("[REDIS][FALLBACK][HGETALL] key={} | error={}", key, e.getMessage());

        try {
            Map<Object, Object> rawMap = masterTemplate.opsForHash().entries(key);
            if (rawMap == null || rawMap.isEmpty()) {
                return Map.of();
            }
            
            Map<String, Object> result = new java.util.HashMap<>();
            for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
                result.put(entry.getKey().toString(), entry.getValue());
            }
            return result;
        } catch (Exception ex) {
            log.error("[REDIS][FALLBACK][HGETALL][MASTER_FAIL] key={} | error={}", key, ex.getMessage());
            return Map.of();
        }
    }

    private <T> List<T> readFallbackGetList(String key, Class<T> clazz, Exception e) {
        log.warn("[REDIS][FALLBACK][GET_LIST] key={} | error={}", key, e.getMessage());

        try {
            List<Object> rawList = masterTemplate.opsForList().range(key, 0, -1);
            if (rawList == null || rawList.isEmpty()) {
                return new ArrayList<>();
            }
            
            List<T> result = new ArrayList<>();
            for (Object item : rawList) {
                if (item != null) {
                    result.add(objectMapper.convertValue(item, clazz));
                }
            }
            return result;
        } catch (Exception ex) {
            log.error("[REDIS][FALLBACK][GET_LIST][MASTER_FAIL] key={} | error={}", key, ex.getMessage());
            return new ArrayList<>();
        }
    }

    private <T> List<T> readFallbackGetListTypeRef(String key, TypeReference<List<T>> typeRef, Exception e) {
        log.warn("[REDIS][FALLBACK][GET_LIST_TYPEREF] key={} | error={}", key, e.getMessage());

        try {
            List<Object> rawList = masterTemplate.opsForList().range(key, 0, -1);
            if (rawList == null || rawList.isEmpty()) {
                return new ArrayList<>();
            }
            return objectMapper.convertValue(rawList, typeRef);
        } catch (Exception ex) {
            log.error("[REDIS][FALLBACK][GET_LIST_TYPEREF][MASTER_FAIL] key={} | error={}", key, ex.getMessage());
            return new ArrayList<>();
        }
    }
}
