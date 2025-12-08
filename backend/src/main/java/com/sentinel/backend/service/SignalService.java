package com.sentinel.backend.service;

import com.sentinel.backend.dto.*;

import java.util.List;

public interface SignalService {
    CreatePollResponse createPoll(PollCreateDTO dto);
    List<UserPollDTO> getAssignedPollsForUser(String userId);
    void submitOrUpdateVote(SubmitPollRequest req);
    PollResultDTO getPollResults(Integer signalId);
    void editSignal(Integer signalId, boolean republish, PollCreateDTO dto); // for poll type reuse PollCreateDTO fields for edit
    void deleteSignal(Integer signalId);
}
