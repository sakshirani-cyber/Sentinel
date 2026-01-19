package com.sentinel.backend.dto.response;

import com.sentinel.backend.dto.helper.UserVoteDTO;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
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

    private List<String> anonymousReasons;

}

