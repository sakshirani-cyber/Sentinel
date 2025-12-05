package com.sentinel.backend.controller;

import com.sentinel.backend.dto.ApiResponse;
import com.sentinel.backend.dto.CreatePollRequest;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollResponse;
import com.sentinel.backend.dto.UserPollDTO;
import com.sentinel.backend.dto.YourDashboardDTO;
import com.sentinel.backend.service.SignalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/signal")
@RequiredArgsConstructor
@Slf4j
public class SignalController {

    private final SignalService signalService;

    @PostMapping("/poll/create")
    public ResponseEntity<ApiResponse<?>> createPoll(@RequestBody @Valid CreatePollRequest request) {
        Integer id = signalService.createPoll(request);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Poll created").data(id).build());
    }

    @GetMapping("/poll/user/{email}")
    public ResponseEntity<ApiResponse<?>> getPollsForUser(@PathVariable("email") String email) {
        List<UserPollDTO> polls = signalService.getAssignedPollsForUser(email);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OK").data(polls).build());
    }

    @PostMapping("/poll/submit")
    public ResponseEntity<ApiResponse<?>> submitVote(@RequestBody @Valid SubmitPollResponse req) {
        signalService.submitOrUpdateVote(req);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Vote saved").build());
    }

    @GetMapping("/poll/result/{signalId}")
    public ResponseEntity<ApiResponse<?>> getPollResults(@PathVariable Integer signalId) {
        PollResultDTO dto = signalService.getPollResults(signalId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OK").data(dto).build());
    }

    @GetMapping("/poll/creator/{createdBy}")
    public ResponseEntity<ApiResponse<?>> listSignalsForCreator(@PathVariable String createdBy) {
        List<YourDashboardDTO> list = signalService.listSignalsForCreator(createdBy);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OK").data(list).build());
    }
}
