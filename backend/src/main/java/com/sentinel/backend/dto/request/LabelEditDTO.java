package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LabelEditDTO {

    @NotNull(message = "Label id is required")
    private Long id;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Color is required")
    private String color;
}
