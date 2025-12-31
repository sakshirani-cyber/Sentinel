package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static com.sentinel.backend.constant.Constants.HEARTBEAT;
import static com.sentinel.backend.constant.Constants.KEEP_ALIVE;

@Component
@RequiredArgsConstructor
@Slf4j
public class SseHeartbeatScheduler {

    private final SseEmitterRegistry registry;

    @Scheduled(fixedRate = 60000)
    public void sendHeartbeat() {

        registry.forEach((userEmail, emitter) -> {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(HEARTBEAT)
                                .comment(KEEP_ALIVE)
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
