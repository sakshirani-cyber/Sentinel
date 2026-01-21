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
    public ResponseEntity<ApiResponse<CreatePollResponse>> createSignal(
            @RequestBody @Valid PollCreateDTO dto) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Create poll request received | createdBy={} | sharedWithCount={}",
                dto.getCreatedBy(),
                dto.getSharedWith() != null ? dto.getSharedWith().length : 0
        );

        CreatePollResponse resp = signalService.createPoll(dto);

        log.info(
                "[CONTROLLER] Create poll completed | signalId={} | localId={} | durationMs={}",
                resp.getSignalId(),
                resp.getLocalId(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(CREATED, resp));
    }

    @PostMapping("/create/poll/scheduled")
    public ResponseEntity<ApiResponse<CreatePollResponse>> createScheduledPoll(
            @RequestBody @Valid PollCreateDTO dto) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Create scheduled poll request received | createdBy={} | sharedWithCount={} | scheduledTime={}",
                dto.getCreatedBy(),
                dto.getSharedWith() != null ? dto.getSharedWith().length : 0,
                dto.getScheduledTime()
        );

        CreatePollResponse resp = signalService.createScheduledPoll(dto);

        log.info(
                "[CONTROLLER] Create scheduled poll completed | reservedSignalId={} | localId={} | durationMs={}",
                resp.getSignalId(),
                resp.getLocalId(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(CREATED, resp));
    }

    @PostMapping("/poll/response")
    public ResponseEntity<ApiResponse<Void>> submitResponse(
            @RequestBody @Valid PollSubmitDTO dto) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Poll response submission received | signalId={} | user={}",
                dto.getSignalId(),
                dto.getUserEmail()
        );

        signalService.submitOrUpdateVote(dto);

        log.info(
                "[CONTROLLER] Poll response submitted | signalId={} | user={} | durationMs={}",
                dto.getSignalId(),
                dto.getUserEmail(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(SAVED, null));
    }

    @GetMapping("/{signalId}/poll/results")
    public ResponseEntity<ApiResponse<PollResultDTO>> results(
            @PathVariable Long signalId) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Fetch poll results request | signalId={}",
                signalId
        );

        PollResultDTO dto = signalService.getPollResults(signalId);

        log.info(
                "[CONTROLLER] Fetch poll results completed | signalId={} | durationMs={}",
                signalId,
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(SUCCESS, dto));
    }

    @PutMapping("/poll/edit")
    public ResponseEntity<ApiResponse<Void>> edit(
            @RequestBody @Valid PollEditDTO dto) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Edit poll request received | signalId={} | editor={}",
                dto.getSignalId(),
                dto.getLastEditedBy()
        );

        signalService.editSignal(dto);

        log.info(
                "[CONTROLLER] Edit poll completed | signalId={} | durationMs={}",
                dto.getSignalId(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(EDITED, null));
    }

    @PutMapping("/poll/edit/scheduled")
    public ResponseEntity<ApiResponse<Void>> editScheduled(
            @RequestBody @Valid PollEditDTO dto) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Edit scheduled poll request received | reservedSignalId={} | editor={}",
                dto.getSignalId(),
                dto.getLastEditedBy()
        );

        signalService.editScheduledSignal(dto);

        log.info(
                "[CONTROLLER] Edit scheduled poll completed | reservedSignalId={} | durationMs={}",
                dto.getSignalId(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(EDITED, null));
    }

    @DeleteMapping("/{signalId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long signalId) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Delete signal request received | signalId={}",
                signalId
        );

        signalService.deleteSignal(signalId);

        log.info(
                "[CONTROLLER] Delete signal completed | signalId={} | durationMs={}",
                signalId,
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(DELETED, null));
    }

    @DeleteMapping("/scheduled/{signalId}")
    public ResponseEntity<ApiResponse<Void>> deleteScheduled(
            @PathVariable Long signalId) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Delete scheduled signal request received | reservedSignalId={}",
                signalId
        );

        signalService.deleteScheduledSignal(signalId);

        log.info(
                "[CONTROLLER] Delete scheduled signal completed | reservedSignalId={} | durationMs={}",
                signalId,
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(DELETED, null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(
            @RequestParam String userEmail,
            @RequestParam String password) {

        long start = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Login attempt | userEmail={}",
                userEmail
        );

        String role = signalService.login(userEmail, password);

        if (role == null) {
            log.warn(
                    "[CONTROLLER] Login failed | userEmail={} | durationMs={}",
                    userEmail,
                    System.currentTimeMillis() - start
            );

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("Invalid userEmail or password"));
        }

        log.info(
                "[CONTROLLER] Login successful | userEmail={} | role={} | durationMs={}",
                userEmail,
                role,
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(SUCCESS, role));
    }
}
