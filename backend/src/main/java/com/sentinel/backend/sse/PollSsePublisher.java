package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollSsePublisher {

    private final SseEmitterRegistry registry;
    private final PollSyncCache pollSyncCache;
    private final AsyncPollDbService dbService;

    public <T> void publish(String[] recipients, String eventType, T payload) {

        long start = System.currentTimeMillis();

        int totalRecipients = recipients != null ? recipients.length : 0;
        int delivered = 0;
        int offline = 0;
        int failed = 0;

        SseEvent<T> event = new SseEvent<>(eventType, Instant.now(), payload);

        for (String userEmail : recipients) {

            SseEmitter emitter = registry.get(userEmail);

            if (emitter == null) {
                offline++;
                storeForLater(userEmail, event);
                continue;
            }

            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventType)
                                .data(event)
                );
                delivered++;

                log.debug("[SSE][PUBLISH] Delivered to active user | userEmail={} | eventType={}", userEmail, eventType);

            } catch (Exception ex) {
                failed++;
                registry.remove(userEmail);
                storeForLater(userEmail, event);

                log.warn(
                        "[SSE][PUBLISH][ERROR] Delivery failed | eventType={} | userEmail={} | exception={}",
                        eventType,
                        userEmail,
                        ex.getMessage()
                );
            }
        }

        log.info(
                "[SSE][PUBLISH] Event publish completed | eventType={} | totalRecipients={} | delivered={} | offline={} | failed={} | durationMs={}",
                eventType,
                totalRecipients,
                delivered,
                offline,
                failed,
                System.currentTimeMillis() - start
        );
    }

    private <T> void storeForLater(String userEmail, SseEvent<T> event) {
        pollSyncCache.put(userEmail, event);
        dbService.asyncInsert(userEmail, event);
    }
}