package com.sentinel.backend.dto.request;

import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollCreateDTO extends BaseSignalDTO {

    @NotBlank(message = "Question is required")
    private String question;

    @NotNull(message = "Options must be provided")
    private String[] options;

    public void normalizePoll() {
        if (question != null) question = question.trim();

        if (options != null) {
            for (int i = 0; i < options.length; i++) {
                if (options[i] != null) options[i] = options[i].trim();
            }
        }
    }

    public void validatePoll() {
        if (question == null || question.trim().isEmpty()) {
            throw new IllegalArgumentException("Question cannot be blank");
        }

        if (options == null || options.length < 2) {
            throw new IllegalArgumentException("Options must contain at least 2 values");
        }

        for (String o : options) {
            if (o == null || o.trim().isEmpty()) {
                throw new IllegalArgumentException("Options cannot contain empty or blank values");
            }
        }

        if (NormalizationUtils.hasDuplicatesIgnoreCase(options)) {
            throw new IllegalArgumentException("Options contain duplicate values (case-insensitive)");
        }

        this.options = NormalizationUtils.trimAndUnique(options);
    }
}
