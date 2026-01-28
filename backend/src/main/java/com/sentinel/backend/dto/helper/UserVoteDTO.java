package com.sentinel.backend.dto.helper;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserVoteDTO {
    private String userEmail;
    private String[] selectedOptions;
    private Instant submittedAt;
}
