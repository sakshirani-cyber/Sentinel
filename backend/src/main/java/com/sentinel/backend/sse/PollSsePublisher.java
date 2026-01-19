package com.sentinel.backend.sse;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;

import static com.sentinel.backend.constant.CacheKeys.SSE_EVENTS;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollSsePublisher {

    private final SseEmitterRegistry registry;
    private final RedisCacheService cache;

    public <T> void publish(String[] recipients, String eventType, T payload) {
        if (recipients == null || recipients.length == 0) {
            log.warn("[SSE][PUBLISH] No recipients provided");
            return;
        }

        long start = System.currentTimeMillis();
        int delivered = 0;
        int offline = 0;
        int failed = 0;

        SseEvent<T> event = new SseEvent<>(eventType, Instant.now(), payload);

        for (String userEmail : recipients) {
            SseEmitter emitter = registry.get(userEmail);

            if (emitter == null) {
                offline++;
                storeEventInRedis(userEmail, event);
                log.debug("[SSE][PUBLISH][OFFLINE] userEmail={} | eventType={}", userEmail, eventType);
                continue;
            }

            try {
                emitter.send(SseEmitter.event().name(eventType).data(event));
                delivered++;
                log.debug("[SSE][PUBLISH][DELIVERED] userEmail={} | eventType={}", userEmail, eventType);
            } catch (Exception ex) {
                failed++;
                registry.remove(userEmail);
                storeEventInRedis(userEmail, event);
                log.warn("[SSE][PUBLISH][FAILED] userEmail={} | eventType={} | error={}", userEmail, eventType, ex.getMessage());
            }
        }

        log.info("[SSE][PUBLISH] eventType={} | total={} | delivered={} | offline={} | failed={} | durationMs={}",
                eventType, recipients.length, delivered, offline, failed, System.currentTimeMillis() - start);
    }

    private <T> void storeEventInRedis(String userEmail, SseEvent<T> event) {
        try {
            String eventsKey = cache.buildKey(SSE_EVENTS, userEmail);
            cache.leftPush(eventsKey, event, cache.getSseEventsTtl());
            log.debug("[SSE][STORE] userEmail={} | eventType={}", userEmail, event.getEventType());
        } catch (Exception ex) {
            // TODO: Implement fallback storage (DB) or alerting for production
            log.error("[SSE][STORE][ERROR] userEmail={} | eventType={} | error={}",
                    userEmail, event.getEventType(), ex.getMessage());
        }
    }
}