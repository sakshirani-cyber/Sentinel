package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.DeliveryStateStore;
import com.sentinel.backend.sse.PollSyncCache;
import com.sentinel.backend.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;

import static com.sentinel.backend.constant.Constants.CONNECTED;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final PollSyncCache pollSyncCache;
    private final DeliveryStateStore deliveryStateStore;

    @GetMapping(value = "/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String userEmail) {

        log.info("[SSE] Connection request received | userEmail={}", userEmail);

        SseEmitter emitter = new SseEmitter(0L);

        registry.add(userEmail, emitter);
        log.info("[SSE] Connection registered | userEmail={}", userEmail);

        try {
            emitter.send(
                    SseEmitter.event()
                            .name(CONNECTED)
                            .reconnectTime(3000)
                            .data("SSE connected")
            );

            log.info("[SSE] Initial handshake event sent | userEmail={}", userEmail);

            checkAndReplayMissedData(userEmail);

        } catch (IOException e) {
            registry.remove(userEmail);
            log.error(
                    "[SSE][ERROR] Failed during handshake | userEmail={} | exception={} | message={}",
                    userEmail,
                    e.getClass().getSimpleName(),
                    e.getMessage(),
                    e
            );
            return emitter;
        }

        emitter.onCompletion(() -> {
            registry.remove(userEmail);
            log.info("[SSE] Connection completed | userEmail={}", userEmail);
        });

        emitter.onTimeout(() -> {
            registry.remove(userEmail);
            log.warn("[SSE] Connection timed out | userEmail={}", userEmail);
        });

        emitter.onError(ex -> {
            registry.remove(userEmail);
            log.warn(
                    "[SSE][ERROR] Connection error | userEmail={} | exception={} | message={}",
                    userEmail,
                    ex.getClass().getSimpleName(),
                    ex.getMessage()
            );
        });

        return emitter;
    }

    private void checkAndReplayMissedData(String userEmail) {

        Instant lastDelivered = deliveryStateStore.getLastDelivered(userEmail);

        var missedEvents = pollSyncCache.getAfter(userEmail, lastDelivered);

        if (missedEvents.isEmpty()) {
            return;
        }

        SseEmitter emitter = registry.get(userEmail);
        if (emitter == null) {
            return;
        }

        for (var event : missedEvents) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(event.getEventType())
                                .data(event)
                );

                deliveryStateStore.updateLastDelivered(
                        userEmail,
                        event.getEventTime()
                );

            } catch (Exception ex) {
                log.warn(
                        "[SSE][SYNC] Replay failed | userEmail={} | reason={}",
                        userEmail,
                        ex.getMessage()
                );
                return;
            }
        }

        pollSyncCache.clear(userEmail);
        log.info("[SSE][SYNC] Replay completed | userEmail={}", userEmail);
    }
}
