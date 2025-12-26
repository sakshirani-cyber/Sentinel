package com.sentinel.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollSubmitDTO {

    @NotNull(message = "Signal ID is required")
    private Integer signalId;

    @NotBlank(message = "User ID is required")
    private String userEmail;

    private String selectedOption;

    private String defaultResponse;

    private String reason;

    public void normalize() {
        if (userEmail != null) userEmail = userEmail.trim();
        if (selectedOption != null) selectedOption = selectedOption.trim();
    }
}
