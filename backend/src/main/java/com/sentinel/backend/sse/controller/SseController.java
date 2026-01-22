package com.sentinel.backend.sse.controller;

import com.sentinel.backend.cache.RedisCacheService;
import com.sentinel.backend.sse.SseEmitterRegistry;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

import static com.sentinel.backend.constant.Constants.CONNECTED;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final RedisCacheService cache;

    @GetMapping(value = "/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String userEmail) {

        long start = System.currentTimeMillis();
        log.info("[SSE][CONNECT] Connection request received | userEmail={}", userEmail);

        SseEmitter emitter = new SseEmitter(0L);
        registry.add(userEmail, emitter);

        emitter.onCompletion(() -> {
            registry.remove(userEmail);
            log.info("[SSE][CONNECT] Connection completed | userEmail={}", userEmail);
        });

        emitter.onTimeout(() -> {
            registry.remove(userEmail);
            log.warn("[SSE][CONNECT] Connection timeout | userEmail={}", userEmail);
        });

        emitter.onError(e -> {
            registry.remove(userEmail);
            log.error("[SSE][CONNECT] Connection error | userEmail={} | error={}",
                    userEmail, e.getMessage());
        });

        try {
            emitter.send(
                    SseEmitter.event()
                            .name(CONNECTED)
                            .data("SSE connected")
            );

            deliverPendingEvents(userEmail, emitter);

        } catch (Exception ex) {
            log.error("[SSE][CONNECT] Failed to establish connection | userEmail={} | error={}",
                    userEmail, ex.getMessage());
            registry.remove(userEmail);
            emitter.completeWithError(ex);
        }

        log.info("[SSE][CONNECT] Connection established | userEmail={} | durationMs={}",
                userEmail, System.currentTimeMillis() - start);

        return emitter;
    }

    private void deliverPendingEvents(String userEmail, SseEmitter emitter) {

        String eventsKey = cache.buildKey("sse:events", userEmail);
        List<SseEvent<?>> events = cache.getList(eventsKey, SseEvent.class);

        if (events == null || events.isEmpty()) {
            log.debug("[SSE][DELIVER] No pending events found | userEmail={}", userEmail);
            return;
        }

        log.info("[SSE][DELIVER] Found {} events in Redis | userEmail={}", events.size(), userEmail);

        if (registry.get(userEmail) == null) {
            log.warn("[SSE][DELIVER] Emitter removed before delivery | userEmail={}", userEmail);
            return;
        }

        int deliveredCount = 0;

        for (SseEvent<?> event : events) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(event.getEventType())
                                .data(event)
                );
                deliveredCount++;

                log.debug("[SSE][DELIVER] Event delivered {}/{} | userEmail={} | eventType={}",
                        deliveredCount, events.size(), userEmail, event.getEventType());

            } catch (Exception ex) {
                log.error("[SSE][DELIVER] Failed to deliver event {} of {} | userEmail={} | error={}",
                        deliveredCount + 1, events.size(), userEmail, ex.getMessage());

                log.warn("[SSE][DELIVER] Keeping {} undelivered events in Redis | userEmail={}",
                        events.size() - deliveredCount, userEmail);

                return;
            }
        }

        if (deliveredCount == events.size()) {
            cache.delete(eventsKey);
            log.info("[SSE][DELIVER] Successfully delivered {} events, cleared from Redis | userEmail={}",
                    deliveredCount, userEmail);
        }
    }
}