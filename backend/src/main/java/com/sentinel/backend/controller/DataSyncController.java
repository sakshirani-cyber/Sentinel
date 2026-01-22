package com.sentinel.backend.controller;

import com.sentinel.backend.service.DataSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
public class DataSyncController {

    private final DataSyncService dataSyncService;

    @GetMapping("/data/sync")
    public void syncData(@RequestParam String userEmail) {
        long start = System.currentTimeMillis();

        log.info("[API][DATA_SYNC] userEmail={}", userEmail);

        dataSyncService.syncAndPublish(userEmail);

        log.info("[API][DATA_SYNC] userEmail={} | durationMs={}", userEmail, System.currentTimeMillis() - start);
    }
}
