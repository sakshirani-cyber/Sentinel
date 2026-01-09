package com.sentinel.backend.dto.response;

import com.sentinel.backend.dto.helper.UserVoteDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PollResultDTO {

    private Long signalId;
    private Integer totalAssigned;
    private Integer totalResponded;

    private Map<String, Integer> optionCounts;
    private Map<String, UserVoteDTO[]> optionVotes;

    private Map<String, UserVoteDTO[]> removedOptions;

    private UserVoteDTO[] defaultResponses;
    private Map<String, String> reasonResponses;

    private Integer defaultCount;
    private Integer reasonCount;
}

