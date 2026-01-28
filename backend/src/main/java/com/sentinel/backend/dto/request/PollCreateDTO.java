package com.sentinel.backend.dto.request;

import com.sentinel.backend.entity.Poll;
import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.Min;
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

    @NotBlank(message = "Selection type is required")
    private String selectionType = Poll.SELECTION_TYPE_SINGLE;

    @Min(value = 1, message = "Max selections must be at least 1")
    private Integer maxSelections;

    public void normalizePoll() {
        question = NormalizationUtils.trimToNull(question);
        options = NormalizationUtils.trimArray(options);
        selectionType = NormalizationUtils.trimToNull(selectionType);
        if (selectionType != null) {
            selectionType = selectionType.toUpperCase();
        }
    }

    public void validatePoll() {

        NormalizationUtils.validateNoBlanks(options, "Options");
        NormalizationUtils.validateUniqueIgnoreCase(options, "Options");

        options = NormalizationUtils.trimAndUniquePreserveOrder(options);

        validateSelectionType();
    }

    private void validateSelectionType() {
        if (selectionType == null) {
            selectionType = Poll.SELECTION_TYPE_SINGLE;
        }

        if (!Poll.SELECTION_TYPE_SINGLE.equals(selectionType) && 
            !Poll.SELECTION_TYPE_MULTI.equals(selectionType)) {
            throw new IllegalArgumentException(
                "Selection type must be either 'SINGLE' or 'MULTI'"
            );
        }

        if (Poll.SELECTION_TYPE_MULTI.equals(selectionType)) {
            if (maxSelections != null && maxSelections > options.length) {
                throw new IllegalArgumentException(
                    "Max selections cannot exceed the number of options"
                );
            }
        } else {
            // For SINGLE selection, maxSelections is always 1
            maxSelections = 1;
        }
    }
}
