package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LabelResponseDTO {

    private Long id;
    private String label;
    private String description;
    private String color;
    private Instant createdAt;
    private Instant editedAt;
}
