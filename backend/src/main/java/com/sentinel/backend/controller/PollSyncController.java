package com.sentinel.backend.controller;

import com.sentinel.backend.dto.response.PollSyncDTO;
import com.sentinel.backend.service.PollSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class PollSyncController {

    private final PollSyncService pollSyncService;

    @GetMapping("/polls/sync")
    public List<PollSyncDTO> syncPolls(
            @RequestParam String email,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant since
    ) {
        return pollSyncService.sync(email, since);
    }
}
