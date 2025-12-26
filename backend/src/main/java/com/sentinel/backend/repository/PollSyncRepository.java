package com.sentinel.backend.repository;

import com.sentinel.backend.dto.response.PollSyncDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static com.sentinel.backend.constant.Queries.SYNC_POLLS_SQL;

@Repository
@RequiredArgsConstructor
public class PollSyncRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<PollSyncDTO> syncPolls(String userEmail, Instant sinceUtc) {

        Timestamp sinceTs = Timestamp.from(sinceUtc);

        return jdbcTemplate.query(
                SYNC_POLLS_SQL,
                (rs, rowNum) -> new PollSyncDTO(
                        rs.getInt("signal_id"),
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
                sinceTs,
                sinceTs,
                sinceTs,
                sinceTs
        );
    }
}
