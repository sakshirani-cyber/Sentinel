package com.sentinel.backend.sse;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollSsePublisher {

    private final SseEmitterRegistry registry;
    private final RedisCacheService cache;

    public <T> void publish(String[] recipients, String eventType, T payload) {

        if (recipients == null || recipients.length == 0) {
            log.warn("[SSE][PUBLISH] No recipients to publish");
            return;
        }

        long start = System.currentTimeMillis();
        int totalRecipients = recipients.length;
        int delivered = 0;
        int offline = 0;
        int failed = 0;

        SseEvent<T> event = new SseEvent<>(eventType, Instant.now(), payload);

        for (String userEmail : recipients) {

            SseEmitter emitter = registry.get(userEmail);

            if (emitter == null) {
                offline++;
                storeEventInRedis(userEmail, event);

                log.debug("[SSE][PUBLISH][OFFLINE] Stored event in Redis | userEmail={} | eventType={}",
                        userEmail, eventType);
                continue;
            }

            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventType)
                                .data(event)
                );
                delivered++;

                log.debug("[SSE][PUBLISH][DELIVERED] Event sent to online user | userEmail={} | eventType={}",
                        userEmail, eventType);

            } catch (Exception ex) {
                failed++;

                registry.remove(userEmail);

                storeEventInRedis(userEmail, event);

                log.warn("[SSE][PUBLISH][FAILED] Delivery failed, stored in Redis | userEmail={} | eventType={} | error={}",
                        userEmail, eventType, ex.getMessage());
            }
        }

        log.info("[SSE][PUBLISH] Event publish completed | eventType={} | totalRecipients={} | " +
                        "delivered={} | offline={} | failed={} | durationMs={}",
                eventType, totalRecipients, delivered, offline, failed,
                System.currentTimeMillis() - start);
    }

    private <T> void storeEventInRedis(String userEmail, SseEvent<T> event) {
        try {
            String eventsKey = cache.buildKey("sse:events", userEmail);

            cache.leftPush(eventsKey, event, cache.getSseEventsTtl());

            log.debug("[REDIS][STORE] Event stored | userEmail={} | eventType={}",
                    userEmail, event.getEventType());

        } catch (Exception ex) {
            log.error("[REDIS][STORE][ERROR] Failed to store event | userEmail={} | eventType={} | error={}",
                    userEmail, event.getEventType(), ex.getMessage());

            // TODO: Critical: Event lost if Redis fails
            // In production, you might want to:
            // 1. Try fallback storage (DB)
            // 2. Alert monitoring system
            // 3. Queue for manual recovery
        }
    }

    public void clearPendingEvents(String userEmail) {
        String eventsKey = cache.buildKey("sse:events", userEmail);
        cache.delete(eventsKey);
        log.info("[SSE][CLEAR] Cleared pending events | userEmail={}", userEmail);
    }

    public long getPendingEventCount(String userEmail) {
        String eventsKey = cache.buildKey("sse:events", userEmail);
        List<Object> events = cache.getList(eventsKey, Object.class);
        return events != null ? events.size() : 0;
    }
}