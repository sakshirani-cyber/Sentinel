package com.sentinel.backend.dto.request;

import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PollSubmitDTO {

    @NotNull(message = "Signal ID is required")
    private Long signalId;

    @NotBlank(message = "User Email is required")
    @Email(message = "Invalid email format")
    private String userEmail;

    private String selectedOption;
    private String defaultResponse;

    @Size(max = 500, message = "Reason cannot exceed 500 characters.")
    private String reason;

    public void normalize() {
        userEmail = NormalizationUtils.trimToNull(userEmail);
        selectedOption = NormalizationUtils.trimToNull(selectedOption);
        defaultResponse = NormalizationUtils.trimToNull(defaultResponse);
        reason = NormalizationUtils.trimToNull(reason);
    }

    @AssertTrue(message = "Exactly one of selectedOption, defaultResponse, or reason must be provided")
    public boolean isExactlyOneResponseProvided() {
        int count = 0;
        if (selectedOption != null && !selectedOption.isBlank()) count++;
        if (defaultResponse != null && !defaultResponse.isBlank()) count++;
        if (reason != null && !reason.isBlank()) count++;
        return count == 1;
    }
}
