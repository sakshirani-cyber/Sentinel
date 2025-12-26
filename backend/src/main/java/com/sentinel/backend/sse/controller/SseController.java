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

        log.info("[SSE] Connection request received | email={}", email);

        SseEmitter emitter = new SseEmitter(0L);

        registry.add(email, emitter);
        log.info("[SSE] Connection registered | email={}", email);

        emitter.onCompletion(() -> {
            registry.remove(email);
            log.info("[SSE] Connection completed | email={}", email);
        });

        emitter.onTimeout(() -> {
            registry.remove(email);
            log.warn("[SSE] Connection timed out | email={}", email);
        });

        emitter.onError(ex -> {
            registry.remove(email);
            log.warn(
                    "[SSE][ERROR] Connection error | email={} | exception={} | message={}",
                    email,
                    ex.getClass().getSimpleName(),
                    ex.getMessage()
            );
        });

        try {
            emitter.send(
                    SseEmitter.event()
                            .name("CONNECTED")
                            .data("SSE connected")
            );

            log.info("[SSE] Initial handshake event sent | email={}", email);

        } catch (IOException e) {

            registry.remove(email);

            log.error(
                    "[SSE][ERROR] Failed to send initial SSE event | email={} | exception={} | message={}",
                    email,
                    e.getClass().getSimpleName(),
                    e.getMessage(),
                    e
            );
        }

        return emitter;
    }
}
