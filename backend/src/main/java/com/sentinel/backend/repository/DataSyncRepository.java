package com.sentinel.backend.repository;

import com.sentinel.backend.dto.response.DataSyncDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.sentinel.backend.constant.Queries.DATA_SYNC_SQL;

@Repository
@RequiredArgsConstructor
@Slf4j
public class DataSyncRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<DataSyncDTO> syncData(String userEmail) {
        long start = System.currentTimeMillis();

        List<DataSyncDTO> result = jdbcTemplate.query(
                DATA_SYNC_SQL,
                (rs, rowNum) -> new DataSyncDTO(
                        rs.getLong("signal_id"),
                        rs.getString("title"),
                        rs.getString("question"),
                        (String[]) rs.getArray("options").getArray(),
                        rs.getString("status"),
                        rs.getString("publisher"),
                        (String[]) rs.getArray("shared_with").getArray(),
                        rs.getBoolean("anonymous"),
                        rs.getBoolean("default_flag"),
                        rs.getString("default_option"),
                        rs.getBoolean("persistent_alert"),
                        rs.getTimestamp("end_timestamp").toInstant(),
                        rs.getTimestamp("last_edited") != null
                                ? rs.getTimestamp("last_edited").toInstant()
                                : null,
                        rs.getString("selected_option"),
                        rs.getString("default_response"),
                        rs.getString("reason"),
                        rs.getTimestamp("time_of_submission") != null
                                ? rs.getTimestamp("time_of_submission").toInstant()
                                : null
                ),
                userEmail,
                userEmail,
                userEmail
        );

        log.info("[DATA_SYNC][DB_HIT] userEmail={} | recordCount={} | durationMs={}",
                userEmail, result.size(), System.currentTimeMillis() - start);

        return result;
    }
}
