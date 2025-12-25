package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;

    @GetMapping(value = "/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String email) {

        SseEmitter emitter = new SseEmitter(0L);

        registry.add(email, emitter);
        log.info("SSE connected: {}", email);

        emitter.onCompletion(() -> {
            registry.remove(email);
            log.info("SSE completed: {}", email);
        });

        emitter.onTimeout(() -> {
            registry.remove(email);
            log.info("SSE timeout: {}", email);
        });

        emitter.onError(ex -> {
            registry.remove(email);
            log.warn("SSE error for {}: {}", email, ex.getMessage());
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("SSE connected"));
        } catch (IOException e) {
            registry.remove(email);
        }

        return emitter;
    }
}
