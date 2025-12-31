package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.DataSyncDTO;
import com.sentinel.backend.repository.DataSyncRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {

    private final DataSyncRepository dataSyncRepository;

    public List<DataSyncDTO> sync(String userEmail) {

        long serviceStart = System.currentTimeMillis();

        log.info(
                "[SERVICE] Data sync started | userEmail={}",
                userEmail
        );

        long dbStart = System.currentTimeMillis();
        List<DataSyncDTO> result = dataSyncRepository.syncData(userEmail);
        long dbDuration = System.currentTimeMillis() - dbStart;

        log.info(
                "[SERVICE] Data sync DB call completed | userEmail={} | recordCount={} | dbDurationMs={}",
                userEmail,
                result != null ? result.size() : 0,
                dbDuration
        );

        log.info(
                "[SERVICE] Data sync completed | userEmail={} | totalDurationMs={}",
                userEmail,
                System.currentTimeMillis() - serviceStart
        );

        return result;
    }
}
