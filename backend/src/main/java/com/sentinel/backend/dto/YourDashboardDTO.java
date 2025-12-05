package com.sentinel.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class YourDashboardDTO {
    private Integer signalId;
    private String typeOfSignal;
    private LocalDateTime createdDate;
    private Integer assignedCount;
    private Integer respondedCount;
    private Boolean expired;
}
