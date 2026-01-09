package com.sentinel.backend.sse.controller;

import com.sentinel.backend.sse.AsyncPollDbService;
import com.sentinel.backend.sse.PollSyncCache;
import com.sentinel.backend.sse.SseEmitterRegistry;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

import static com.sentinel.backend.constant.Constants.CONNECTED;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterRegistry registry;
    private final PollSyncCache pollSyncCache;
    private final AsyncPollDbService dbService;

    @GetMapping(value = "/sse/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect(@RequestParam String userEmail) {

        long start = System.currentTimeMillis();
        log.info("[SSE] Connection request received | userEmail={}", userEmail);

        SseEmitter emitter = new SseEmitter(0L);
        registry.add(userEmail, emitter);

        try {
            emitter.send(
                    SseEmitter.event()
                            .name(CONNECTED)
                            .data("SSE connected")
            );

            checkAndDeliver(userEmail);

        } catch (Exception ex) {
            registry.remove(userEmail);
        }

        emitter.onCompletion(() -> registry.remove(userEmail));
        emitter.onTimeout(() -> registry.remove(userEmail));
        emitter.onError(e -> registry.remove(userEmail));

        log.info("[SSE] Connection request completed | userEmail={} | durationMs={}", userEmail, System.currentTimeMillis()  - start);

        return emitter;
    }

    private void checkAndDeliver(String userEmail) {

        List<SseEvent<?>> events = pollSyncCache.consume(userEmail);

        if (events == null || events.isEmpty()) {
            events = dbService.loadPending(userEmail);
            if (events == null || events.isEmpty()) {
                return;
            }
            pollSyncCache.put(userEmail, events);
        }

        SseEmitter emitter = registry.get(userEmail);
        if (emitter == null) {
            pollSyncCache.put(userEmail, events);
            return;
        }

        for (SseEvent<?> event : events) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(event.getEventType())
                                .data(event)
                );
            } catch (Exception ex) {
                pollSyncCache.put(userEmail, events);
                return;
            }
        }

        pollSyncCache.consume(userEmail);
        dbService.asyncDelete(userEmail);
    }
}
