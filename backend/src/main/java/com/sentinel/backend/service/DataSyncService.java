package com.sentinel.backend.service;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.dto.response.DataSyncDTO;
import com.sentinel.backend.repository.DataSyncRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

import static com.sentinel.backend.constant.Constants.DATA_SYNC;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {

    private final DataSyncRepository dataSyncRepository;
    private final PollSsePublisher pollSsePublisher;
    private final RedisCacheService cache;

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    public void syncAndPublish(String userEmail) {

        long startTime = System.currentTimeMillis();

        log.info("[SERVICE][DATA_SYNC] Data sync triggered | userEmail={}", userEmail);

        String cacheKey = cache.buildKey("data_sync", userEmail);
        List<DataSyncDTO> result = cache.get(cacheKey,
                new com.fasterxml.jackson.core.type.TypeReference<List<DataSyncDTO>>() {});

        if (result != null) {
            log.info("[SERVICE][DATA_SYNC][CACHE_HIT] Using cached data | userEmail={} | recordCount={} | durationMs={}",
                    userEmail, result.size(), System.currentTimeMillis() - startTime);

            pollSsePublisher.publish(new String[]{userEmail}, DATA_SYNC, result);
            return;
        }

        log.info("[SERVICE][DATA_SYNC][CACHE_MISS] Fetching from database | userEmail={}", userEmail);

        long dbStart = System.currentTimeMillis();
        result = dataSyncRepository.syncData(userEmail);
        long dbDuration = System.currentTimeMillis() - dbStart;

        log.info("[SERVICE][DATA_SYNC][DB_FETCH] Database fetch completed | userEmail={} | " +
                        "recordCount={} | dbDurationMs={}",
                userEmail, result != null ? result.size() : 0, dbDuration);

        if (result != null && !result.isEmpty()) {
            cache.set(cacheKey, result, CACHE_TTL);
            log.debug("[SERVICE][DATA_SYNC][CACHE_SET] Cached result | userEmail={} | ttl={}min",
                    userEmail, CACHE_TTL.toMinutes());
        }

        pollSsePublisher.publish(new String[]{userEmail}, DATA_SYNC, result);

        log.info("[SERVICE][DATA_SYNC] Data sync completed | userEmail={} | recordCount={} | " +
                        "totalDurationMs={} | dbDurationMs={}",
                userEmail, result != null ? result.size() : 0,
                System.currentTimeMillis() - startTime, dbDuration);
    }

    public void invalidateCache(String userEmail) {
        String cacheKey = cache.buildKey("data_sync", userEmail);
        cache.delete(cacheKey);
        log.debug("[SERVICE][DATA_SYNC][CACHE_INVALIDATE] Cache invalidated | userEmail={}", userEmail);
    }

    public void invalidateCache(String[] userEmails) {
        if (userEmails == null || userEmails.length == 0) {
            return;
        }

        for (String userEmail : userEmails) {
            invalidateCache(userEmail);
        }

        log.debug("[SERVICE][DATA_SYNC][CACHE_INVALIDATE] Cache invalidated for {} users",
                userEmails.length);
    }
}