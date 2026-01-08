package com.sentinel.backend.dto.request;

import com.sentinel.backend.model.SignalType;
import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Arrays;

@Data
public abstract class SignalDTO {

    @NotBlank(message = "Created By is required")
    private String createdBy;

    @NotNull(message = "Anonymous flag is required")
    private Boolean anonymous;

    @NotBlank(message = "End Time Stamp is required")
    private String endTimestamp;

    @NotNull(message = "Shared With List cannot be null")
    private String[] sharedWith;

    @NotBlank(message = "Type is required")
    private String type;

    @NotNull(message = "Local ID is required")
    private Long localId;

    @NotNull(message = "Default Flag is required")
    private Boolean defaultFlag;

    @NotBlank(message = "Default option is required")
    private String defaultOption;

    @NotNull(message = "Persistent Flag is required")
    private Boolean persistentAlert;

    private Instant parsedEndUtc;

    public void normalizeCommon() {
        createdBy = NormalizationUtils.trimToNull(createdBy);
        endTimestamp = NormalizationUtils.trimToNull(endTimestamp);
        type = NormalizationUtils.trimToNull(type);
        defaultOption = NormalizationUtils.trimToNull(defaultOption);

        sharedWith = NormalizationUtils.trimArray(sharedWith);
    }

    public void validateCommon() {

        validateType();
        validateEndTimestamp();
        validateSharedWith();
    }

    private void validateEndTimestamp() {
        try {
            Instant parsed = Instant.parse(endTimestamp);
            if (parsed.isBefore(Instant.now())) {
                throw new IllegalArgumentException(
                        "End Time Stamp must be in the future (UTC)"
                );
            }
            this.parsedEndUtc = parsed;
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "End Time Stamp must be UTC ISO-8601 format, e.g. 2025-12-17T16:30:00Z"
            );
        }
    }

    private void validateSharedWith() {
        if (sharedWith == null || sharedWith.length == 0) {
            throw new IllegalArgumentException(
                    "Shared With List must contain at least one user"
            );
        }

        NormalizationUtils.validateNoBlanks(sharedWith, "Shared With List");
        NormalizationUtils.validateUniqueIgnoreCase(sharedWith, "Shared With List");

        sharedWith = NormalizationUtils.trimAndUniquePreserveOrder(sharedWith);
    }

    public Instant getEndTimestampUtc() {
        return parsedEndUtc;
    }

    public void validateType() {
        try {
            String normalized = type.toUpperCase();
            SignalType.valueOf(normalized);
            this.type = normalized;
        } catch (Exception e) {
            throw new IllegalArgumentException(
                    "Invalid type. Allowed values: " +
                            Arrays.toString(SignalType.values())
            );
        }
    }
}
