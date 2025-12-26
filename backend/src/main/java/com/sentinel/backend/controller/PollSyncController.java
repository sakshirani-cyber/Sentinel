package com.sentinel.backend.controller;

import com.sentinel.backend.dto.response.PollSyncDTO;
import com.sentinel.backend.service.PollSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PollSyncController {

    private final PollSyncService pollSyncService;

    @GetMapping("/polls/sync")
    public List<PollSyncDTO> syncPolls(
            @RequestParam String email,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant since
    ) {

        long startTime = System.currentTimeMillis();

        log.info(
                "[CONTROLLER] Poll sync request received | endpoint=/polls/sync | email={} | since={}",
                email, since
        );

        List<PollSyncDTO> response = pollSyncService.sync(email, since);

        long durationMs = System.currentTimeMillis() - startTime;

        log.info(
                "[CONTROLLER] Poll sync request completed | email={} | resultCount={} | durationMs={}",
                email,
                response != null ? response.size() : 0,
                durationMs
        );

        return response;
    }
}
