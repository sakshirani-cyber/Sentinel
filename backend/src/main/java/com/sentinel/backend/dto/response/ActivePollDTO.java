package com.sentinel.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class ActivePollDTO {

    private Integer signalId;
    private String question;
    private String[] options;
    private Instant endTimestamp;
    private Boolean anonymous;
    private String defaultOption;
    private Boolean defaultFlag;
    private String publisherEmail;
}