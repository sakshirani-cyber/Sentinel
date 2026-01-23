package com.sentinel.backend.controller;

import com.sentinel.backend.dto.request.PollCreateDTO;
import com.sentinel.backend.dto.request.PollEditDTO;
import com.sentinel.backend.dto.request.PollSubmitDTO;
import com.sentinel.backend.dto.response.ApiResponse;
import com.sentinel.backend.dto.response.CreatePollResponse;
import com.sentinel.backend.dto.response.PollResultDTO;
import com.sentinel.backend.service.SignalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.sentinel.backend.constant.Constants.CREATED;
import static com.sentinel.backend.constant.Constants.DELETED;
import static com.sentinel.backend.constant.Constants.EDITED;
import static com.sentinel.backend.constant.Constants.SAVED;
import static com.sentinel.backend.constant.Constants.SUCCESS;

@RestController
@RequestMapping("/api/signals")
@RequiredArgsConstructor
@Slf4j
public class SignalController {

    private final SignalService signalService;

    @PostMapping("/create/poll")
    public ResponseEntity<ApiResponse<CreatePollResponse>> createPoll(@RequestBody @Valid PollCreateDTO dto) {
        long start = System.currentTimeMillis();
        CreatePollResponse response = signalService.createPoll(dto);
        log.info("[API][POLL][CREATE] signalId={} | createdBy={} | recipientCount={} | durationMs={}",
                response.getSignalId(), dto.getCreatedBy(),
                dto.getSharedWith() != null ? dto.getSharedWith().length : 0, System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(CREATED, response));
    }

    @PostMapping("/create/poll/scheduled")
    public ResponseEntity<ApiResponse<CreatePollResponse>> createScheduledPoll(@RequestBody @Valid PollCreateDTO dto) {
        long start = System.currentTimeMillis();
        CreatePollResponse response = signalService.createScheduledPoll(dto);
        log.info("[API][POLL][SCHEDULE] reservedId={} | createdBy={} | scheduledTime={} | durationMs={}",
                response.getSignalId(), dto.getCreatedBy(), dto.getScheduledTime(), System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(CREATED, response));
    }

    @PostMapping("/poll/response")
    public ResponseEntity<ApiResponse<Void>> submitVote(@RequestBody @Valid PollSubmitDTO dto) {
        long start = System.currentTimeMillis();
        signalService.submitOrUpdateVote(dto);
        log.info("[API][POLL][VOTE] signalId={} | user={} | durationMs={}",
                dto.getSignalId(), dto.getUserEmail(), System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(SAVED, null));
    }

    @GetMapping("/{signalId}/poll/results")
    public ResponseEntity<ApiResponse<PollResultDTO>> getPollResults(@PathVariable Long signalId) {
        long start = System.currentTimeMillis();
        PollResultDTO dto = signalService.getPollResults(signalId);
        log.info("[API][POLL][RESULTS] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(SUCCESS, dto));
    }

    @PutMapping("/poll/edit")
    public ResponseEntity<ApiResponse<Void>> editPoll(@RequestBody @Valid PollEditDTO dto) {
        long start = System.currentTimeMillis();
        signalService.editSignal(dto);
        log.info("[API][POLL][EDIT] signalId={} | editor={} | durationMs={}",
                dto.getSignalId(), dto.getLastEditedBy(), System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(EDITED, null));
    }

    @PutMapping("/poll/edit/scheduled")
    public ResponseEntity<ApiResponse<Void>> editScheduledPoll(@RequestBody @Valid PollEditDTO dto) {
        long start = System.currentTimeMillis();
        signalService.editScheduledSignal(dto);
        log.info("[API][POLL][SCHEDULE_EDIT] reservedId={} | editor={} | durationMs={}",
                dto.getSignalId(), dto.getLastEditedBy(), System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(EDITED, null));
    }

    @DeleteMapping("/{signalId}")
    public ResponseEntity<ApiResponse<Void>> deletePoll(@PathVariable Long signalId) {
        long start = System.currentTimeMillis();
        signalService.deleteSignal(signalId);
        log.info("[API][POLL][DELETE] signalId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(DELETED, null));
    }

    @DeleteMapping("/scheduled/{signalId}")
    public ResponseEntity<ApiResponse<Void>> deleteScheduledPoll(@PathVariable Long signalId) {
        long start = System.currentTimeMillis();
        signalService.deleteScheduledSignal(signalId);
        log.info("[API][POLL][SCHEDULE_DELETE] reservedId={} | durationMs={}", signalId, System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(DELETED, null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@RequestParam String userEmail, @RequestParam String password) {
        long start = System.currentTimeMillis();
        String role = signalService.login(userEmail, password);

        if (role == null) {
            log.warn("[API][AUTH][LOGIN] userEmail={} | result=FAILED | durationMs={}",
                    userEmail, System.currentTimeMillis() - start);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("Invalid userEmail or password"));
        }

        log.info("[API][AUTH][LOGIN] userEmail={} | role={} | result=SUCCESS | durationMs={}",
                userEmail, role, System.currentTimeMillis() - start);
        return ResponseEntity.ok(ApiResponse.success(SUCCESS, role));
    }
}
