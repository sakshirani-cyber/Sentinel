package com.sentinel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PollResultDTO {
    private Integer signalId;
    private Integer totalAssigned;
    private Integer totalResponded;
    private Map<String, Integer> optionCounts;
    private Map<String, String[]> optionToUsers; // null if anonymous true
    private Map<String, String[]> archivedOptions;
}
