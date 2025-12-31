package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.DataSyncDTO;
import com.sentinel.backend.repository.DataSyncRepository;
import com.sentinel.backend.sse.PollSsePublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.sentinel.backend.constant.Constants.DATA_SYNC;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {

    private final DataSyncRepository dataSyncRepository;
    private final PollSsePublisher pollSsePublisher;

    public void syncAndPublish(String userEmail) {

        long serviceStart = System.currentTimeMillis();

        log.info(
                "[SERVICE][DATA_SYNC] Sync triggered | userEmail={}",
                userEmail
        );

        long dbStart = System.currentTimeMillis();
        List<DataSyncDTO> result = dataSyncRepository.syncData(userEmail);
        long dbDuration = System.currentTimeMillis() - dbStart;

        log.info(
                "[SERVICE][DATA_SYNC] DB fetch completed | userEmail={} | recordCount={} | dbDurationMs={}",
                userEmail,
                result != null ? result.size() : 0,
                dbDuration
        );

        pollSsePublisher.publish(
                new String[]{userEmail},
                DATA_SYNC,
                result
        );

        log.info(
                "[SERVICE][DATA_SYNC] Publish requested | userEmail={} | totalDurationMs={}",
                userEmail,
                System.currentTimeMillis() - serviceStart
        );
    }
}
