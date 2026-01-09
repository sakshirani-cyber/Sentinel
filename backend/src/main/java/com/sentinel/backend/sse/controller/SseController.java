package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.AsyncPollDbService;
import com.sentinel.backend.sse.PollSyncCache;
import com.sentinel.backend.sse.SseEmitterRegistry;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;

import static com.sentinel.backend.constant.Constants.CONNECTED;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final PollSyncCache pollSyncCache;
    private final AsyncPollDbService dbService;

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
            log.error("[SSE][CONNECT] Connection error | userEmail={} | error={}", userEmail, e.getMessage());
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

        List<SseEvent<?>> events = pollSyncCache.get(userEmail);
        boolean loadedFromDb = false;

        if (events == null || events.isEmpty()) {
            log.debug("[SSE][DELIVER] Cache empty, loading from DB | userEmail={}", userEmail);

            events = dbService.loadPending(userEmail);
            loadedFromDb = true;

            if (events == null || events.isEmpty()) {
                log.debug("[SSE][DELIVER] No pending events found | userEmail={}", userEmail);
                return;
            }

            log.info("[SSE][DELIVER] Loaded {} events from DB | userEmail={}", events.size(), userEmail);
        } else {
            log.info("[SSE][DELIVER] Found {} events in cache | userEmail={}", events.size(), userEmail);
        }

        if (registry.get(userEmail) == null) {
            log.warn("[SSE][DELIVER] Emitter removed before delivery | userEmail={}", userEmail);
            if (!loadedFromDb) {
                pollSyncCache.put(userEmail, events);
            }
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

            } catch (Exception ex) {
                log.error("[SSE][DELIVER] Failed to deliver event {} of {} | userEmail={} | error={}",
                        deliveredCount + 1, events.size(), userEmail, ex.getMessage());

                List<SseEvent<?>> undelivered = new ArrayList<>(
                        events.subList(deliveredCount, events.size())
                );
                pollSyncCache.put(userEmail, undelivered);

                log.warn("[SSE][DELIVER] Stored {} undelivered events back to cache | userEmail={}",
                        undelivered.size(), userEmail);

                return;
            }
        }

        log.info("[SSE][DELIVER] Successfully delivered {} events | userEmail={}",
                deliveredCount, userEmail);

        pollSyncCache.clear(userEmail);
        dbService.asyncDelete(userEmail);
    }
}