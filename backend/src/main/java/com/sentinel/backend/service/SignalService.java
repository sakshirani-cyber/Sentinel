package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.response.PollResultDTO;
import com.sentinel.backend.dto.request.SubmitPollRequest;

public interface SignalService {
    CreatePollResponse createPoll(PollCreateDTO dto);
    void submitOrUpdateVote(SubmitPollRequest req);
    PollResultDTO getPollResults(Integer signalId);
    void editSignal(Integer signalId, boolean republish, PollCreateDTO dto);
    void deleteSignal(Integer signalId);
    String login(String email, String password);
}
