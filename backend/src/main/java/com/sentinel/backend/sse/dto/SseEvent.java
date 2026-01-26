package com.sentinel.backend.sse.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SseEvent<T> {

    private String eventType;
    private Instant eventTime;
    private T payload;
}
