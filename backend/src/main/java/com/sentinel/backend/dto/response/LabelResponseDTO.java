package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class LabelResponseDTO {

    private Long id;
    private String label;
    private String description;
    private String color;
    private Instant createdAt;
    private Instant editedAt;
}
