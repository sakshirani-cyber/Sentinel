package com.sentinel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePollRequest {

    @NotBlank(message = "CreatedBy is required")
    private String createdBy;

    @NotBlank(message = "End date is required")
    private String endDate;

    @NotBlank(message = "End time is required")
    private String endTime;

    @NotBlank(message = "Type of signal is required")
    private String typeOfSignal;

    @NotNull(message = "SharedWith list cannot be empty")
    private String[] sharedWith;

    @NotBlank(message = "Question cannot be blank")
    private String question;

    @NotNull(message = "Options cannot be empty")
    @Size(min = 2, max = 10, message = "Poll must contain between 2 and 10 options")
    private String[] options;

    @NotBlank(message = "Default option is required")
    private String defaultOption;

    @NotNull(message = "Anonymous flag required")
    private Boolean anonymous;

    private Boolean defaultFlag;
}

