package com.sentinel.backend.dto.helper;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserVoteDTO {
    private String userEmail;
    private String selectedOption;
    private Instant submittedAt;
}
