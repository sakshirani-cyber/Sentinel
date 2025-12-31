package com.sentinel.backend.sse;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DeliveryStateStore {

    private final Map<String, Instant> lastDeliveredAt = new ConcurrentHashMap<>();

    public Instant getLastDelivered(String userEmail) {
        return lastDeliveredAt.get(userEmail);
    }

    public void updateLastDelivered(String userEmail, Instant deliveredAt) {
        lastDeliveredAt.put(userEmail, deliveredAt);
    }
}
