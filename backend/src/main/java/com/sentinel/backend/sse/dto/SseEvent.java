package com.sentinel.backend.sse.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class SseEvent<T> {

    private String eventType;
    private Instant eventTime;
    private T payload;
}
