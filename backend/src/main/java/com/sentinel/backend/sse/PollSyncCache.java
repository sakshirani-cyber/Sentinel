package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class PollSyncCache {

    private final Map<String, List<SseEvent<?>>> cache = new ConcurrentHashMap<>();

    public void put(String userEmail, List<SseEvent<?>> events) {
        if (events != null && !events.isEmpty()) {
            cache.put(userEmail, new ArrayList<>(events));
            log.debug("[CACHE][PUT] Stored {} events for userEmail={}", events.size(), userEmail);
        }
    }

    public void put(String userEmail, SseEvent<?> event) {
        cache.compute(userEmail, (k, v) -> {
            if (v == null) {
                v = new ArrayList<>();
            }
            v.add(event);
            return v;
        });
        log.debug("[CACHE][PUT] Added 1 event for userEmail={}", userEmail);
    }

    public List<SseEvent<?>> get(String userEmail) {
        List<SseEvent<?>> events = cache.get(userEmail);
        return events != null ? new ArrayList<>(events) : null;
    }

    public void clear(String userEmail) {
        cache.remove(userEmail);
        log.debug("[CACHE][CLEAR] Cleared all events for userEmail={}", userEmail);
    }

    public int size() {
        return cache.size();
    }
}