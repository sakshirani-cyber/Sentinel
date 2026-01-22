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

import static com.sentinel.backend.constant.CacheKeys.DATA_SYNC;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {

    private final DataSyncRepository dataSyncRepository;
    private final PollSsePublisher pollSsePublisher;
    private final RedisCacheService cache;

    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    public void syncAndPublish(String userEmail) {
        long start = System.currentTimeMillis();

        String cacheKey = cache.buildKey(DATA_SYNC, userEmail);
        List<DataSyncDTO> result = cache.get(cacheKey,
                new com.fasterxml.jackson.core.type.TypeReference<List<DataSyncDTO>>() {});

        if (result != null) {
            log.info("[DATA_SYNC][CACHE_HIT] userEmail={} | recordCount={} | durationMs={}",
                    userEmail, result.size(), System.currentTimeMillis() - start);

            pollSsePublisher.publish(new String[]{userEmail}, com.sentinel.backend.constant.Constants.DATA_SYNC, result);
            return;
        }

        log.debug("[DATA_SYNC][CACHE_MISS] userEmail={}", userEmail);

        long dbStart = System.currentTimeMillis();
        result = dataSyncRepository.syncData(userEmail);
        long dbDuration = System.currentTimeMillis() - dbStart;

        if (result != null && !result.isEmpty()) {
            cache.set(cacheKey, result, CACHE_TTL);
        }

        pollSsePublisher.publish(new String[]{userEmail}, com.sentinel.backend.constant.Constants.DATA_SYNC, result);

        log.info("[DATA_SYNC] userEmail={} | recordCount={} | dbDurationMs={} | totalDurationMs={}",
                userEmail, result != null ? result.size() : 0, dbDuration, System.currentTimeMillis() - start);
    }

    public void invalidateCache(String userEmail) {
        cache.delete(cache.buildKey(DATA_SYNC, userEmail));
        log.debug("[DATA_SYNC][CACHE_INVALIDATE] userEmail={}", userEmail);
    }

    public void invalidateCache(String[] userEmails) {
        if (userEmails == null || userEmails.length == 0) {
            return;
        }

        for (String userEmail : userEmails) {
            invalidateCache(userEmail);
        }

        log.debug("[DATA_SYNC][CACHE_INVALIDATE] userCount={}", userEmails.length);
    }
}