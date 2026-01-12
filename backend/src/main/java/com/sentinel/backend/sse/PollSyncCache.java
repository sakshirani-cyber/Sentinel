package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PollSyncCache {

    private final Map<String, List<SseEvent<?>>> cache = new ConcurrentHashMap<>();

    public void put(String userEmail, List<SseEvent<?>> events) {
        cache.put(userEmail, events);
    }

    public void put(String userEmail, SseEvent<?> event) {
        cache.compute(userEmail, (k, v) -> {
            if (v == null) {
                v = new java.util.ArrayList<>();
            }
            v.add(event);
            return v;
        });
    }

    public List<SseEvent<?>> consume(String userEmail) {
        return cache.remove(userEmail);
    }

    public boolean isEmpty() {
        return cache.isEmpty();
    }
}
