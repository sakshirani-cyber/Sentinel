package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.PollSyncDTO;
import com.sentinel.backend.repository.PollSyncRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PollSyncService {

    private final PollSyncRepository pollSyncRepository;

    public List<PollSyncDTO> sync(String userEmail, Instant sinceUtc) {
        return pollSyncRepository.syncPolls(userEmail, sinceUtc);
    }
}
