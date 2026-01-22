package com.sentinel.backend.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collection;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    @Qualifier("redisMasterTemplate")
    private final RedisTemplate<String, Object> masterTemplate;

    @Qualifier("redisSlaveTemplate")
    private final RedisTemplate<String, Object> slaveTemplate;

    private final ObjectMapper objectMapper;

    @Value("${cache.poll.ttl.minutes:60}")
    private long pollTtlMinutes;

    @Value("${cache.poll.results.ttl.minutes:5}")
    private long pollResultsTtlMinutes;

    @Value("${cache.sse.events.ttl.hours:24}")
    private long sseEventsTtlHours;

    // ==================== WRITE OPERATIONS (Master) ====================

    @CircuitBreaker(name = "redis", fallbackMethod = "writeFallbackSet")
    public void set(String key, Object value, Duration ttl) {
        masterTemplate.opsForValue().set(key, value, ttl);
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
        masterTemplate.delete(keys);
    }

    // ==================== FALLBACK METHODS ====================

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
        log.warn("[REDIS][FALLBACK][DELETE_MULTI] count={} | error={}", keys.size(), e.getMessage());
    }
}
