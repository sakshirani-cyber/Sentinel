package com.sentinel.backend.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class SseEmitterRegistry {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public void add(String email, SseEmitter emitter) {

        int beforeCount = emitters.size();

        SseEmitter old = emitters.put(email, emitter);

        if (old != null) {
            old.complete();

            log.warn(
                    "[SSE][REGISTRY] Replaced existing emitter (duplicate connection) | email={} | activeBefore={} | activeAfter={}",
                    email,
                    beforeCount,
                    emitters.size()
            );
        } else {
            log.info(
                    "[SSE][REGISTRY] New emitter added | email={} | activeCount={}",
                    email,
                    emitters.size()
            );
        }
    }

    public void remove(String email) {

        SseEmitter removed = emitters.remove(email);

        if (removed != null) {
            log.info(
                    "[SSE][REGISTRY] Emitter removed | email={} | activeCount={}",
                    email,
                    emitters.size()
            );
        } else {
            log.debug(
                    "[SSE][REGISTRY] Remove requested but emitter not found | email={}",
                    email
            );
        }
    }

    public SseEmitter get(String email) {

        SseEmitter emitter = emitters.get(email);

        if (emitter == null) {
            log.debug(
                    "[SSE][REGISTRY] Emitter lookup miss | email={}",
                    email
            );
        }

        return emitter;
    }
}
