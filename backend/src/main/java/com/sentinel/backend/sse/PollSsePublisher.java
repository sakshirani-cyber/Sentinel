package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class PollSsePublisher {

    private final SseEmitterRegistry registry;

    public <T> void publish(String[] recipients, String eventType, T payload) {

        long start = System.currentTimeMillis();

        int totalRecipients = recipients != null ? recipients.length : 0;
        int delivered = 0;
        int offline = 0;
        int failed = 0;

        log.info(
                "[SSE][PUBLISH] Event publish started | eventType={} | totalRecipients={}",
                eventType,
                totalRecipients
        );

        SseEvent<T> event = new SseEvent<>(
                eventType,
                Instant.now(),
                payload
        );

        for (String email : recipients) {

            SseEmitter emitter = registry.get(email);

            if (emitter == null) {
                offline++;
                log.debug(
                        "[SSE][PUBLISH] Recipient offline | eventType={} | email={}",
                        eventType,
                        email
                );
                continue;
            }

            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventType)
                                .data(event)
                );

                delivered++;

            } catch (IOException ex) {

                failed++;
                registry.remove(email);

                log.warn(
                        "[SSE][PUBLISH][ERROR] Delivery failed | eventType={} | email={} | exception={} | message={}",
                        eventType,
                        email,
                        ex.getClass().getSimpleName(),
                        ex.getMessage()
                );
            }
        }

        log.info(
                "[SSE][PUBLISH] Event publish completed | eventType={} | delivered={} | offline={} | failed={} | durationMs={}",
                eventType,
                delivered,
                offline,
                failed,
                System.currentTimeMillis() - start
        );
    }
}
