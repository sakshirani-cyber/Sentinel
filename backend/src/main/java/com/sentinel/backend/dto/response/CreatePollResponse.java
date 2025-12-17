package com.sentinel.backend.dto.response;

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
