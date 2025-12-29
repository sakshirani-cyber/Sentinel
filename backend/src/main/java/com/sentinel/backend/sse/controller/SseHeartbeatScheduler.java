package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
@RequiredArgsConstructor
@Slf4j
public class SseHeartbeatScheduler {

    private final SseEmitterRegistry registry;

    @Scheduled(fixedRate = 20000) // every 20 seconds
    public void sendHeartbeat() {

        registry.forEach((userEmail, emitter) -> {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name("HEARTBEAT")
                                .comment("keep-alive")
                );
            } catch (Exception ex) {
                registry.remove(userEmail);
                log.warn(
                        "[SSE][HEARTBEAT] Failed | userEmail={} | reason={}",
                        userEmail,
                        ex.getMessage()
                );
            }
        });
    }
}
