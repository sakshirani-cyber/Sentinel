package com.sentinel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitPollRequest {

    @NotNull(message = "signalId is required")
    private Integer signalId;

    @NotBlank(message = "userId is required")
    private String userId;

    @NotBlank(message = "selectedOption is required")
    private String selectedOption;

    public void normalize() {
        if (userId != null) userId = userId.trim();
        if (selectedOption != null) selectedOption = selectedOption.trim();
    }
}
