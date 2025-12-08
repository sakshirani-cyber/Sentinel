package com.sentinel.backend.controller;

import com.sentinel.backend.dto.ApiResponse;
import com.sentinel.backend.dto.CreatePollResponse;
import com.sentinel.backend.dto.PollCreateDTO;
import com.sentinel.backend.dto.PollResultDTO;
import com.sentinel.backend.dto.SubmitPollRequest;
import com.sentinel.backend.service.SignalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/signals")
@RequiredArgsConstructor
public class SignalController {

    private final SignalService signalService;

    @PostMapping
    public ResponseEntity<ApiResponse<CreatePollResponse>> createSignal(@RequestBody @Valid PollCreateDTO req) {
        // normalize + validate common + poll-specific
        req.normalizeCommon();
        req.normalizePoll();

        req.validateCommon();
        req.validatePoll();

        CreatePollResponse resp = signalService.createPoll(req);
        return ResponseEntity.status(201).body(ApiResponse.success("Created", resp));
    }

    @PostMapping("/poll/response")
    public ResponseEntity<ApiResponse<Void>> submitResponse(@RequestBody @Valid SubmitPollRequest req) {
        req.setSignalId(req.getSignalId());
        req.normalize();
        signalService.submitOrUpdateVote(req);
        return ResponseEntity.ok(ApiResponse.success("Saved", null));
    }

    @GetMapping("/{signalId}/poll/results")
    public ResponseEntity<ApiResponse<PollResultDTO>> results(@PathVariable Integer signalId) {
        PollResultDTO dto = signalService.getPollResults(signalId);
        return ResponseEntity.ok(ApiResponse.success("OK", dto));
    }

    @PutMapping("/{signalId}")
    public ResponseEntity<ApiResponse<Void>> edit(@PathVariable Integer signalId,
                                                  @RequestParam(defaultValue = "true") boolean republish,
                                                  @RequestBody @Valid PollCreateDTO dto) {
        signalService.editSignal(signalId, republish, dto);
        return ResponseEntity.ok(ApiResponse.success("Edited", null));
    }

    @DeleteMapping("/{signalId}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Integer signalId) {
        signalService.deleteSignal(signalId);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}
