package com.sentinel.backend.dto;

import lombok.Data;

@Data
public class CreatePollResponse {
    private Integer cloudSignalId;
    private Integer localId;
}
