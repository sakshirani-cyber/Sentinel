package com.sentinel.backend.sse.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class PollSsePayload {

    private Integer signalId;
    private String question;
    private String[] options;

    private Instant endTimestamp;
    private Boolean anonymous;

    private Boolean defaultFlag;
    private String defaultOption;

    private Boolean persistentAlert;

    private String createdBy;
    private String[] sharedWith;

    private boolean republish;
}
