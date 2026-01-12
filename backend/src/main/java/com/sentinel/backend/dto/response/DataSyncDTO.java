package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class DataSyncDTO {

    private Integer signalId;
    private String question;
    private String[] options;
    private String status;

    private String publisher;
    private String[] sharedWith;

    private Boolean anonymous;
    private Boolean defaultFlag;
    private String defaultOption;
    private Boolean persistentAlert;

    private Instant endTimestamp;
    private Instant lastEdited;

    private String selectedOption;
    private String defaultResponse;
    private String reason;
    private Instant timeOfSubmission;
}
