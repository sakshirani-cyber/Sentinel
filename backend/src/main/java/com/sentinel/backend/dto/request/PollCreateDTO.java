package com.sentinel.backend.dto.request;

import com.sentinel.backend.util.NormalizationUtils;
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
public class PollCreateDTO extends SignalDTO {

    @NotBlank(message = "Question is required")
    @Size(min = 3, max = 1000, message = "Question Size should be between 3-1000 characters")
    private String question;

    @NotNull(message = "Options must be provided")
    @Size(min = 2, max = 10, message = "Must have 2-10 options")
    private String[] options;

    public void normalizePoll() {
        question = NormalizationUtils.trimToNull(question);
        options = NormalizationUtils.trimArray(options);
    }

    public void validatePoll() {

        NormalizationUtils.validateNoBlanks(options, "Options");
        NormalizationUtils.validateUniqueIgnoreCase(options, "Options");

        options = NormalizationUtils.trimAndUniquePreserveOrder(options);
    }
}
