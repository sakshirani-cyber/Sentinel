package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.PollSyncDTO;
import com.sentinel.backend.repository.PollSyncRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PollSyncService {

    private final PollSyncRepository pollSyncRepository;

    public List<PollSyncDTO> sync(String userEmail, Instant sinceUtc) {

        long serviceStart = System.currentTimeMillis();

        log.info(
                "[SERVICE] Poll sync started | userEmail={} | sinceUtc={}",
                userEmail, sinceUtc
        );

        long dbStart = System.currentTimeMillis();
        List<PollSyncDTO> result = pollSyncRepository.syncPolls(userEmail, sinceUtc);
        long dbDuration = System.currentTimeMillis() - dbStart;

        log.info(
                "[SERVICE] Poll sync DB call completed | userEmail={} | recordCount={} | dbDurationMs={}",
                userEmail,
                result != null ? result.size() : 0,
                dbDuration
        );

        log.info(
                "[SERVICE] Poll sync completed | userEmail={} | totalDurationMs={}",
                userEmail,
                System.currentTimeMillis() - serviceStart
        );

        return result;
    }
}
