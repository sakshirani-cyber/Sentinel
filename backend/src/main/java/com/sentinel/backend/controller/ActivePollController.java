package com.sentinel.backend.controller;

import com.sentinel.backend.dto.response.ActivePollDTO;
import com.sentinel.backend.service.ActivePollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/polls")
@RequiredArgsConstructor
public class ActivePollController {

    private final ActivePollService activePollService;

    @GetMapping("/active")
    public List<ActivePollDTO> getActivePolls(
            @RequestParam String userId
    ) {
        return activePollService.getActivePollsForUser(userId);
    }
}
