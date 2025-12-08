package com.sentinel.backend.dto;

import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PollCreateDTO extends BaseSignalDTO {

    @NotBlank(message = "question is required")
    private String question;

    @NotNull(message = "options must be provided")
    private String[] options;

    /** Trim + basic normalization for poll-specific fields */
    public void normalizePoll() {
        if (question != null) question = question.trim();

        if (options != null) {
            for (int i = 0; i < options.length; i++) {
                if (options[i] != null) options[i] = options[i].trim();
            }
        }
    }

    /** Validate options: at least 2, no blank, no duplicates (case-insensitive) */
    public void validatePoll() {
        if (question == null || question.trim().isEmpty()) {
            throw new IllegalArgumentException("question cannot be blank");
        }

        if (options == null || options.length < 2) {
            throw new IllegalArgumentException("options must contain at least 2 values");
        }

        // empty/blank check
        for (String o : options) {
            if (o == null || o.trim().isEmpty()) {
                throw new IllegalArgumentException("options cannot contain empty or blank values");
            }
        }

        // duplicates case-insensitive check
        if (NormalizationUtils.hasDuplicatesIgnoreCase(options)) {
            throw new IllegalArgumentException("options contain duplicate values (case-insensitive)");
        }

        // After validation, canonicalize options (trim + unique preserving order)
        this.options = NormalizationUtils.trimAndUnique(options);
    }
}
