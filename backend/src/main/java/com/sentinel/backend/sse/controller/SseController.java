package com.sentinel.backend.sse.controller;

import com.fasterxml.jackson.core.type.TypeReference;
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

import static com.sentinel.backend.constant.CacheKeys.SSE_EVENTS;
import static com.sentinel.backend.constant.Constants.CONNECTED;
import static com.sentinel.backend.constant.Constants.PENDING_EVENTS;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final RedisCacheService cache;

    @GetMapping(value = "/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String userEmail) {
        long start = System.currentTimeMillis();

        SseEmitter emitter = new SseEmitter(0L);
        registry.add(userEmail, emitter);

        emitter.onCompletion(() -> {
            registry.remove(userEmail);
            log.info("[SSE][DISCONNECT] userEmail={} | reason=completed", userEmail);
        });

        emitter.onTimeout(() -> {
            registry.remove(userEmail);
            log.warn("[SSE][DISCONNECT] userEmail={} | reason=timeout", userEmail);
        });

        emitter.onError(e -> {
            registry.remove(userEmail);
            log.error("[SSE][DISCONNECT] userEmail={} | reason=error | error={}", userEmail, e.getMessage());
        });

        try {
            emitter.send(SseEmitter.event().name(CONNECTED).data("SSE connected"));
            deliverPendingEvents(userEmail, emitter);
            log.info("[SSE][CONNECT] userEmail={} | activeConnections={} | durationMs={}",
                    userEmail, registry.size(), System.currentTimeMillis() - start);
        } catch (Exception ex) {
            log.error("[SSE][CONNECT][ERROR] userEmail={} | error={}", userEmail, ex.getMessage());
            registry.remove(userEmail);
            emitter.completeWithError(ex);
        }

        return emitter;
    }

    private void deliverPendingEvents(String userEmail, SseEmitter emitter) {
        long start = System.currentTimeMillis();
        String eventsKey = cache.buildKey(SSE_EVENTS, userEmail);
        List<SseEvent<Object>> events = cache.getList(eventsKey, new TypeReference<List<SseEvent<Object>>>() {});

        if (events == null || events.isEmpty()) {
            log.debug("[SSE][PENDING][CACHE_MISS] userEmail={} | durationMs={}", userEmail, System.currentTimeMillis() - start);
            return;
        }

        log.info("[SSE][PENDING][CACHE_HIT] userEmail={} | eventCount={} | durationMs={}",
                userEmail, events.size(), System.currentTimeMillis() - start);

        if (registry.get(userEmail) == null) {
            log.warn("[SSE][DELIVER] Emitter removed before delivery | userEmail={}", userEmail);
            return;
        }

        long deliverStart = System.currentTimeMillis();

        try {
            emitter.send(SseEmitter.event().name(PENDING_EVENTS).data(events));

            cache.delete(eventsKey);
            
            log.info("[SSE][DELIVER][BATCH] userEmail={} | eventCount={} | deliveryDurationMs={} | totalDurationMs={}",
                    userEmail, events.size(), System.currentTimeMillis() - deliverStart, System.currentTimeMillis() - start);
        } catch (Exception ex) {
            log.error("[SSE][DELIVER][BATCH][ERROR] userEmail={} | eventCount={} | error={}",
                    userEmail, events.size(), ex.getMessage());
        }
    }
}