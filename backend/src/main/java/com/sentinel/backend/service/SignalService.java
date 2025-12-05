package com.sentinel.backend.service;

import com.sentinel.backend.dto.CreatePollRequest;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollResponse;
import com.sentinel.backend.dto.UserPollDTO;
import com.sentinel.backend.dto.YourDashboardDTO;

import java.util.List;

public interface SignalService {
    Integer createPoll(CreatePollRequest request);
    List<UserPollDTO> getAssignedPollsForUser(String userEmail);
    void submitOrUpdateVote(SubmitPollResponse req);
    PollResultDTO getPollResults(Integer signalId);
    List<YourDashboardDTO> listSignalsForCreator(String createdBy); // simple HR dashboard
}
