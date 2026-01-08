package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LabelCreateDTO {

    @NotBlank(message = "Label is required")
    private String label;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Color is required")
    @Pattern(
            regexp = "^#[0-9A-Fa-f]{6}$",
            message = "Color must be a valid hex value (e.g. #FF0000)"
    )
    private String color;
}
