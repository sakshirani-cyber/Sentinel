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

    private Integer signalId;
    private Integer totalAssigned;
    private Integer totalResponded;

    private Map<String, Integer> optionCounts;
    private Map<String, UserVoteDTO[]> optionVotes;

    private Map<String, UserVoteDTO[]> archivedOptions;
    private Map<String, UserVoteDTO[]> removedUsers;

    private UserVoteDTO[] defaultResponses;
    private Map<String, String> reasonResponses;

    private Integer defaultCount;
    private Integer reasonCount;
}

