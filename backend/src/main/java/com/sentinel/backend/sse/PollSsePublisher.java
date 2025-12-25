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

        SseEvent<T> event = new SseEvent<>(
                eventType,
                Instant.now(),
                payload
        );

        for (String email : recipients) {

            SseEmitter emitter = registry.get(email);
            if (emitter == null) {
                continue;
            }

            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventType)
                                .data(event)
                );
            } catch (IOException ex) {
                registry.remove(email);
                log.warn("SSE failed for {}. Removed emitter.", email);
            }
        }
    }
}
