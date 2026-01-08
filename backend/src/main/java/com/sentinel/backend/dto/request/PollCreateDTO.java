package com.sentinel.backend.dto.request;

import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollCreateDTO extends SignalDTO {

    @NotBlank(message = "Question is required")
    private String question;

    @NotNull(message = "Options must be provided")
    private String[] options;

    public void normalizePoll() {
        question = NormalizationUtils.trimToNull(question);
        options = NormalizationUtils.trimArray(options);
    }

    public void validatePoll() {

        if (options == null || options.length < 2) {
            throw new IllegalArgumentException(
                    "Options must contain at least 2 values"
            );
        }

        NormalizationUtils.validateNoBlanks(options, "Options");
        NormalizationUtils.validateUniqueIgnoreCase(options, "Options");

        options = NormalizationUtils.trimAndUniquePreserveOrder(options);
    }
}
