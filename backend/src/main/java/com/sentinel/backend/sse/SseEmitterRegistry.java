package com.sentinel.backend.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.BiConsumer;

@Component
@Slf4j
public class SseEmitterRegistry {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public void add(String userEmail, SseEmitter emitter) {

        int beforeCount = emitters.size();

        SseEmitter old = emitters.put(userEmail, emitter);

        if (old != null) {
            old.complete();

            log.warn(
                    "[SSE][REGISTRY] Replaced existing emitter (duplicate connection) | userEmail={} | activeBefore={} | activeAfter={}",
                    userEmail,
                    beforeCount,
                    emitters.size()
            );
        } else {
            log.info(
                    "[SSE][REGISTRY] New emitter added | userEmail={} | activeCount={}",
                    userEmail,
                    emitters.size()
            );
        }
    }

    public void remove(String userEmail) {

        SseEmitter removed = emitters.remove(userEmail);

        if (removed != null) {
            log.info(
                    "[SSE][REGISTRY] Emitter removed | userEmail={} | activeCount={}",
                    userEmail,
                    emitters.size()
            );
        } else {
            log.error(
                    "[SSE][REGISTRY] Remove requested but emitter not found | userEmail={}",
                    userEmail
            );
        }
    }

    public SseEmitter get(String userEmail) {

        SseEmitter emitter = emitters.get(userEmail);

        if (emitter == null) {
            log.error(
                    "[SSE][REGISTRY] Emitter lookup miss | userEmail={}",
                    userEmail
            );
        }

        return emitter;
    }

    public void forEach(BiConsumer<String, SseEmitter> consumer) {
        emitters.forEach(consumer);
    }
}
