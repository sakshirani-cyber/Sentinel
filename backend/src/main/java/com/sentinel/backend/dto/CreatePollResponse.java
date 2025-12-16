package com.sentinel.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreatePollResponse {
    private Integer cloudSignalId;
    private Long localId;
}
