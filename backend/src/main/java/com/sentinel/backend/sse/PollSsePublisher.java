package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollSsePublisher {

    private final SseEmitterRegistry registry;
    private final PollSyncCache pollSyncCache;
    private final AsyncPollDbService dbService;

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

        List<String> offlineUsers = new ArrayList<>();

        for (String userEmail : recipients) {

            SseEmitter emitter = registry.get(userEmail);

            if (emitter == null) {
                offline++;
                offlineUsers.add(userEmail);
                pollSyncCache.put(userEmail, event);
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
                offlineUsers.add(userEmail);
                pollSyncCache.put(userEmail, event);

                log.warn(
                        "[SSE][PUBLISH][ERROR] Delivery failed | eventType={} | userEmail={} | exception={}",
                        eventType,
                        userEmail,
                        ex.getMessage()
                );
            }
        }

        if (!offlineUsers.isEmpty()) {
            dbService.asyncBatchInsert(
                    offlineUsers.toArray(new String[0]),
                    event
            );

            log.info(
                    "[SSE][PUBLISH] Scheduled batch DB insert for {} offline users",
                    offlineUsers.size()
            );
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
}