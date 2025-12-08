package com.sentinel.backend.dto;

import com.sentinel.backend.model.SignalType;
import com.sentinel.backend.util.NormalizationUtils;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Arrays;

@Data
public abstract class BaseSignalDTO {

    @NotBlank(message = "createdBy is required")
    private String createdBy;

    @NotNull(message = "anonymous flag is required")
    private Boolean anonymous;

    @NotBlank(message = "endTimestamp is required")
    private String endTimestamp; // ISO 8601

    @NotNull(message = "sharedWith cannot be null")
    private String[] sharedWith;

    @NotNull(message = "type is required")
    private String type;

    private Boolean defaultFlag;
    private String defaultOption;

    /** Trim + basic normalization for common fields */
    public void normalizeCommon() {
        if (createdBy != null) createdBy = createdBy.trim();
        if (defaultOption != null) defaultOption = defaultOption.trim();

        // trim sharedWith but keep duplicates for validation step (we will set to unique later if validation passes)
        if (sharedWith != null) {
            for (int i = 0; i < sharedWith.length; i++) {
                if (sharedWith[i] != null) sharedWith[i] = sharedWith[i].trim();
            }
        }
    }

    /** Validate common fields (timestamp in future, no duplicate sharedWith etc.) */
    public void validateCommon() {
        validateType();
        // 1. endTimestamp parse + future
        Instant end;
        try {
            end = Instant.parse(endTimestamp);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("endTimestamp must be ISO-8601 instant (e.g. 2025-12-10T18:30:00Z)");
        }
        if (end.isBefore(Instant.now())) throw new IllegalArgumentException("endTimestamp must be in the future");

        // 2. sharedWith must not be empty and must not contain blanks
        if (sharedWith == null || sharedWith.length == 0) {
            throw new IllegalArgumentException("sharedWith must contain at least one user id");
        }
        for (String s : sharedWith) {
            if (s == null || s.trim().isEmpty()) {
                throw new IllegalArgumentException("sharedWith contains empty/blank user id(s)");
            }
        }

        // 3. duplicates check case-insensitive
        if (NormalizationUtils.hasDuplicatesIgnoreCase(sharedWith)) {
            throw new IllegalArgumentException("sharedWith contains duplicate user ids (case-insensitive)");
        }

        // After validation, store canonical trimmed-unique array for downstream use
        this.sharedWith = NormalizationUtils.trimAndUnique(sharedWith);
    }

    /** Helper to parse end timestamp */
    public Instant parseEndTimestamp() {
        try {
            return Instant.parse(endTimestamp);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("endTimestamp must be ISO-8601 instant (e.g. 2025-12-10T18:30:00Z)");
        }
    }

    public void validateType() {
        if (type == null || type.trim().isEmpty()) {
            throw new IllegalArgumentException("type is required");
        }

        try {
            // Normalize string before validation
            String normalized = type.trim().toUpperCase();
            SignalType.valueOf(normalized);
            type = normalized; // store canonical value (uppercase)
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid type. Allowed values: " + Arrays.toString(SignalType.values())
            );
        }
    }
}
