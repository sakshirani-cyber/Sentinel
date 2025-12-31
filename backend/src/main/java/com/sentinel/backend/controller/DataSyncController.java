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
    public void dataSync(@RequestParam String userEmail) {

        long startTime = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Manual data sync triggered | endpoint=/data/sync | userEmail={}",
                userEmail
        );

        dataSyncService.syncAndPublish(userEmail);

        log.info(
                "[CONTROLLER] Data sync trigger completed | userEmail={} | durationMs={}",
                userEmail,
                System.currentTimeMillis() - startTime
        );
    }
}
