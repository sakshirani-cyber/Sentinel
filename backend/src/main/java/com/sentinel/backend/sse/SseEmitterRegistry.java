package com.sentinel.backend.sse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseEmitterRegistry {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public void add(String email, SseEmitter emitter) {
        SseEmitter old = emitters.put(email, emitter);
        if (old != null) {
            old.complete();
        }
    }

    public void remove(String email) {
        emitters.remove(email);
    }

    public SseEmitter get(String email) {
        return emitters.get(email);
    }
}
