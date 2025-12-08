package com.sentinel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitPollRequest {

    @NotNull
    private Integer signalId;

    @NotBlank
    private String userId;

    @NotBlank
    private String selectedOption;

    public void normalize() {
        if (userId != null) userId = userId.trim();
        if (selectedOption != null) selectedOption = selectedOption.trim();
    }
}
