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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        if (ttl != null) {
            masterTemplate.opsForValue().set(key, value, ttl);
        } else {
            masterTemplate.opsForValue().set(key, value);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hSetFallback")
    public void hSet(String key, String field, Object value) {
        masterTemplate.opsForHash().put(key, field, value);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hSetAllFallback")
    public void hSetAll(String key, Map<String, Object> values, Duration ttl) {
        masterTemplate.opsForHash().putAll(key, values);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "incrFallback")
    public Long incr(String key) {
        return masterTemplate.opsForValue().increment(key);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "addToSortedSetFallback")
    public void addToSortedSet(String key, Object value, double score, Duration ttl) {
        masterTemplate.opsForZSet().add(key, value, score);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "deleteFallback")
    public void delete(String key) {
        masterTemplate.delete(key);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "deleteMultipleFallback")
    public void deleteMultiple(Collection<String> keys) {
        if (keys != null && !keys.isEmpty()) {
            masterTemplate.delete(keys);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "leftPushFallback")
    public void leftPush(String key, Object value, Duration ttl) {
        masterTemplate.opsForList().leftPush(key, value);
        if (ttl != null) {
            masterTemplate.expire(key, ttl);
        }
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getFallback")
    public <T> T get(String key, Class<T> clazz) {
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, clazz);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getTypeRefFallback")
    public <T> T get(String key, TypeReference<T> typeRef) {
        Object value = slaveTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        return objectMapper.convertValue(value, typeRef);
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "hGetAllFallback")
    public Map<String, Object> hGetAll(String key) {
        Map<Object, Object> rawMap = slaveTemplate.opsForHash().entries(key);
        if (rawMap == null || rawMap.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : rawMap.entrySet()) {
            result.put(entry.getKey().toString(), entry.getValue());
        }
        return result;
    }

    @CircuitBreaker(name = "redis", fallbackMethod = "getListFallback")
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

    @CircuitBreaker(name = "redis", fallbackMethod = "getListTypeRefFallback")
    public <T> List<T> getList(String key, TypeReference<List<T>> typeRef) {
        List<Object> rawList = slaveTemplate.opsForList().range(key, 0, -1);
        if (rawList == null || rawList.isEmpty()) {
            return new ArrayList<>();
        }

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

    private void deleteMultipleFallback(Collection<String> keys, Exception e) {
        log.warn("[REDIS][WRITE_FALLBACK] operation=DELETE_MULTI | count={} | error={}",
                keys != null ? keys.size() : 0, e.getMessage());
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

    private <T> List<T> getListFallback(String key, Class<T> clazz, Exception e) {
        log.warn("[REDIS][READ_FALLBACK] operation=LRANGE | key={} | error={}", key, e.getMessage());
        return tryReadListFromMaster(key, clazz);
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

    private <T> List<T> tryReadListFromMaster(String key, Class<T> clazz) {
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
            log.error("[REDIS][MASTER_FALLBACK_FAILED] operation=LRANGE | key={} | error={}", key, ex.getMessage());
            return new ArrayList<>();
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
}
