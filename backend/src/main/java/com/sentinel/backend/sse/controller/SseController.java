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
    public SseEmitter connect(@RequestParam String userEmail) {

        log.info("[SSE] Connection request received | usermail={}", userEmail);

        SseEmitter emitter = new SseEmitter(0L);

        registry.add(userEmail, emitter);
        log.info("[SSE] Connection registered | usermail={}", userEmail);

        emitter.onCompletion(() -> {
            registry.remove(userEmail);
            log.info("[SSE] Connection completed | usermail={}", userEmail);
        });

        emitter.onTimeout(() -> {
            registry.remove(userEmail);
            log.warn("[SSE] Connection timed out | usermail={}", userEmail);
        });

        emitter.onError(ex -> {
            registry.remove(userEmail);
            log.warn(
                    "[SSE][ERROR] Connection error | usermail={} | exception={} | message={}",
                    userEmail,
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

            log.info("[SSE] Initial handshake event sent | usermail={}", userEmail);

        } catch (IOException e) {

            registry.remove(userEmail);

            log.error(
                    "[SSE][ERROR] Failed to send initial SSE event | usermail={} | exception={} | message={}",
                    userEmail,
                    e.getClass().getSimpleName(),
                    e.getMessage(),
                    e
            );
        }

        return emitter;
    }
}
