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

    public void normalizeCommon() {
        if (createdBy != null) createdBy = createdBy.trim();
        if (endTimestamp != null) endTimestamp = endTimestamp.trim();
        if (type != null) type = type.trim();
        if (defaultOption != null) defaultOption = defaultOption.trim();

        if (sharedWith != null) {
            for (int i = 0; i < sharedWith.length; i++) {
                if (sharedWith[i] != null) sharedWith[i] = sharedWith[i].trim();
            }
        }
    }

    private Instant parsedEndUtc;

    public void validateCommon() {
        validateType();

        try {
            Instant parsed = Instant.parse(endTimestamp);

            if (parsed.isBefore(Instant.now())) {
                throw new IllegalArgumentException("End Time Stamp must be in the future (UTC)");
            }

            this.parsedEndUtc = parsed;

        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "End Time Stamp must be UTC ISO-8601 format, e.g. 2025-12-17T16:30:00Z"
            );
        }

        if (sharedWith == null || sharedWith.length == 0) {
            throw new IllegalArgumentException("Shared With List must contain at least one user");
        }

        this.sharedWith = NormalizationUtils.trimAndUnique(sharedWith);

        for (String s : sharedWith) {
            if (s == null || s.trim().isEmpty()) {
                throw new IllegalArgumentException("Shared With List contains empty/blank user id(s)");
            }
        }

        if (NormalizationUtils.hasDuplicatesIgnoreCase(sharedWith)) {
            throw new IllegalArgumentException("Shared With List contains duplicate user ids (case-insensitive)");
        }

        this.sharedWith = NormalizationUtils.trimAndUnique(sharedWith);
    }

    public Instant getEndTimestampUtc() {
        return parsedEndUtc;
    }

    public void validateType() {
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("Type is required");
        }

        try {
            String normalized = type.trim().toUpperCase();
            SignalType.valueOf(normalized);
            type = normalized;
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid type. Allowed values: " + Arrays.toString(SignalType.values())
            );
        }
    }
}
