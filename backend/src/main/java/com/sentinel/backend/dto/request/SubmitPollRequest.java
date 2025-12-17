package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitPollRequest {

    @NotNull(message = "signalId is required")
    private Integer signalId;

    @NotBlank(message = "userId is required")
    private String userId;

    private String selectedOption;

    private String defaultResponse;

    private String reason;

    public void normalize() {
        if (userId != null) userId = userId.trim();
        if (selectedOption != null) selectedOption = selectedOption.trim();
    }
}
