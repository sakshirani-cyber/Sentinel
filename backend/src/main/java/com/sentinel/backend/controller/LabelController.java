package com.sentinel.backend.controller;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.request.LabelEditDTO;
import com.sentinel.backend.dto.response.ApiResponse;
import com.sentinel.backend.dto.response.CreateLabelResponse;
import com.sentinel.backend.dto.response.LabelResponseDTO;
import com.sentinel.backend.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.sentinel.backend.constant.Constants.CREATED;
import static com.sentinel.backend.constant.Constants.SUCCESS;

@RestController
@RequiredArgsConstructor
@Slf4j
public class LabelController {

    private final LabelService labelService;

    @PostMapping("/create/label")
    public ResponseEntity<ApiResponse<CreateLabelResponse>> createLabel(
            @RequestBody @Valid LabelCreateDTO req) {

        long start = System.currentTimeMillis();

        log.info(
                "[LABEL][CREATE][REQUEST] label={}, color={}",
                req.getLabel(),
                req.getColor()
        );

        CreateLabelResponse response = labelService.createLabel(req);

        log.info(
                "[LABEL][CREATE][SUCCESS] durationMs={}",
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(CREATED, response));
    }

    @GetMapping("/labels")
    public ResponseEntity<ApiResponse<List<LabelResponseDTO>>> getAllLabels() {

        long start = System.currentTimeMillis();

        log.info("[LABEL][GET_ALL][REQUEST]");

        List<LabelResponseDTO> labels = labelService.getAllLabels();

        log.info(
                "[LABEL][GET_ALL][SUCCESS] | size={} | durationMs={}",
                labels.size(),
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(SUCCESS, labels));
    }

    @PostMapping("/edit/label")
    public ResponseEntity<ApiResponse<Void>> editLabel(
            @RequestBody @Valid LabelEditDTO req) {

        long start = System.currentTimeMillis();

        log.info(
                "[LABEL][EDIT][REQUEST] id={}",
                req.getId()
        );

        labelService.editLabel(req);

        log.info(
                "[LABEL][EDIT][SUCCESS] durationMs={}",
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(SUCCESS, null));
    }
}