package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.PollEditDTO;
import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.response.PollResultDTO;
import com.sentinel.backend.dto.request.PollSubmitDTO;

public interface SignalService {
    CreatePollResponse createPoll(PollCreateDTO dto);
    void submitOrUpdateVote(PollSubmitDTO req);
    PollResultDTO getPollResults(Integer signalId);
    void editSignal(PollEditDTO dto);
    void deleteSignal(Integer signalId);
    String login(String email, String password);
}
