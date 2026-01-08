package com.sentinel.backend.controller;

import com.sentinel.backend.dto.request.LabelCreateDTO;
import com.sentinel.backend.dto.response.ApiResponse;
import com.sentinel.backend.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static com.sentinel.backend.constant.Constants.CREATED;

@RestController
@RequiredArgsConstructor
@Slf4j
public class LabelController {

    private final LabelService labelService;

    @PostMapping("/create/label")
    public ResponseEntity<ApiResponse<Void>> createLabel(
            @RequestBody @Valid LabelCreateDTO req) {

        long start = System.currentTimeMillis();

        log.info(
                "[LABEL][CREATE][REQUEST] label={}, color={}",
                req.getLabel(),
                req.getColor()
        );

        labelService.createLabel(req);

        log.info(
                "[LABEL][CREATE][SUCCESS] durationMs={}",
                System.currentTimeMillis() - start
        );

        return ResponseEntity.ok(ApiResponse.success(CREATED, null));
    }
}