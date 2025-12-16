package com.sentinel.backend.service;

import com.sentinel.backend.dto.CreatePollResponse;
import com.sentinel.backend.dto.PollCreateDTO;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollRequest;

public interface SignalService {
    CreatePollResponse createPoll(PollCreateDTO dto);
    void submitOrUpdateVote(SubmitPollRequest req);
    PollResultDTO getPollResults(Integer signalId);
    void editSignal(Integer signalId, boolean republish, PollCreateDTO dto);
    void deleteSignal(Integer signalId);
    String login(String email, String password);
}
