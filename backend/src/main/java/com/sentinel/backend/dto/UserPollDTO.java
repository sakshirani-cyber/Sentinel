package com.sentinel.backend.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class UserPollDTO {
    private Integer cloudSignalId;
    private String question;
    private String[] options;
    private Boolean anonymous;
    private Instant endTimestamp;
    private String defaultOption;
}
