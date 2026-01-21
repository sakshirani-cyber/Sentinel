package com.sentinel.backend.service;

import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.request.PollEditDTO;
import com.sentinel.backend.dto.request.PollSubmitDTO;
import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.response.PollResultDTO;

public interface SignalService {

    CreatePollResponse createPoll(PollCreateDTO dto);

    CreatePollResponse createScheduledPoll(PollCreateDTO dto);

    void submitOrUpdateVote(PollSubmitDTO dto);

    PollResultDTO getPollResults(Long signalId);

    void editSignal(PollEditDTO dto);

    void editScheduledSignal(PollEditDTO dto);

    void deleteSignal(Long signalId);

    void deleteScheduledSignal(Long signalId);

    String login(String userEmail, String password);
}