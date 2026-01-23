package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LabelCreateDTO {

    @NotBlank(message = "Label is required")
    @Pattern(
            regexp = "^~#[^~]+~$",
            message = "Label must be in format ~#labelName~"
    )
    @Size(max = 100, message = "Label cannot exceed 100 characters")
    private String label;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private Long localId;
}
