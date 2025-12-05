package com.sentinel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitPollResponse {

    @NotNull(message = "Signal ID is required")
    private Integer signalId;

    @NotBlank(message = "User email is required")
    private String userEmail;

    @NotBlank(message = "Selected option is required")
    private String selectedOption;
}

