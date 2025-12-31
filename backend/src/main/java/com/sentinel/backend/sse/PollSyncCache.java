package com.sentinel.backend.sse;

import com.sentinel.backend.sse.dto.SseEvent;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PollSyncCache {

    private final Map<String, List<SseEvent<?>>> cache = new ConcurrentHashMap<>();

    public void put(String userEmail, SseEvent<?> event) {
        List<SseEvent<?>> list = cache.computeIfAbsent(userEmail, k -> new ArrayList<>());

        synchronized (list) {
            list.add(event);
            if (list.size() > 500) {
                list.remove(0);
            }
        }
    }

    public List<SseEvent<?>> getAfter(String userEmail, Instant after) {
        return cache.getOrDefault(userEmail, List.of())
                .stream()
                .filter(e -> after == null || e.getEventTime().isAfter(after))
                .toList();
    }

    public void clear(String userEmail) {
        cache.remove(userEmail);
    }
}
