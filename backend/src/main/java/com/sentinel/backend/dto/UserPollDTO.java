package com.sentinel.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class UserPollDTO {
    private Integer signalId;
    private String question;
    private String[] options;
    private Boolean anonymous;
    private LocalDate endDate;
    private LocalTime endTime;
    private Boolean alreadyVoted;
    private String selectedOption;
}
