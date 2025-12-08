package com.sentinel.backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class PollResultDTO {
    private Integer signalId;
    private Integer totalAssigned;
    private Integer totalResponded;
    private Map<String, Integer> optionCounts;
    private Map<String, String[]> optionToUsers; // null if anonymous true
}
