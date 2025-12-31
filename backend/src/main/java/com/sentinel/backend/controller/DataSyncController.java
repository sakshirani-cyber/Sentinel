package com.sentinel.backend.controller;

import com.sentinel.backend.dto.response.DataSyncDTO;
import com.sentinel.backend.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class DataSyncController {

    private final DataSyncService dataSyncService;

    @GetMapping("/data/sync")
    public List<DataSyncDTO> dataSync(
            @RequestParam String userEmail
    ) {

        long startTime = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Data Sync request received | endpoint=/data/sync | userEmail={}",
                userEmail
        );

        List<DataSyncDTO> response = dataSyncService.sync(userEmail);

        long durationMs = System.currentTimeMillis() - startTime;

        log.info(
                "[CONTROLLER] Data Sync request completed | userEmail={} | resultCount={} | durationMs={}",
                userEmail,
                response != null ? response.size() : 0,
                durationMs
        );

        return response;
    }
}
