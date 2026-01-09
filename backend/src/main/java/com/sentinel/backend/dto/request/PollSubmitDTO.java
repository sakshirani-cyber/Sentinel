package com.sentinel.backend.dto.request;

import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollSubmitDTO {

    @NotNull(message = "Signal ID is required")
    private Long signalId;

    @NotBlank(message = "User Email is required")
    private String userEmail;

    private String selectedOption;
    private String defaultResponse;
    private String reason;

    public void normalize() {
        userEmail = NormalizationUtils.trimToNull(userEmail);
        selectedOption = NormalizationUtils.trimToNull(selectedOption);
        defaultResponse = NormalizationUtils.trimToNull(defaultResponse);
        reason = NormalizationUtils.trimToNull(reason);
    }
}
