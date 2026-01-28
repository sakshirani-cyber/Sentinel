package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DataSyncDTO {

    private Long signalId;
    private String title;
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
    private Boolean showIndividualResponses;

    private String selectedOptions;
    private String defaultResponse;
    private String reason;
    private Instant timeOfSubmission;
}
