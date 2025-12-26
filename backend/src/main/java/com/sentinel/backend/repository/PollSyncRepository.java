package com.sentinel.backend.repository;

import com.sentinel.backend.dto.response.PollSyncDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class PollSyncRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<PollSyncDTO> syncPolls(String userEmail, Instant sinceUtc) {

        Timestamp sinceTs = Timestamp.from(sinceUtc);

        String sql = """
        SELECT
            s.id AS signal_id,
            p.question,
            p.options,
            s.status,
            s.created_by AS publisher,
            s.shared_with,
            s.anonymous,
            s.default_flag,
            s.default_option,
            s.persistent_alert,
            s.end_timestamp,
            s.last_edited,
            r.selected_option,
            r.default_response,
            r.reason,
            r.time_of_submission
        FROM signal s
        JOIN poll p ON p.signal_id = s.id
        LEFT JOIN poll_result r
               ON r.signal_id = s.id
              AND r.user_id = ?
        WHERE
            ? = ANY (s.shared_with)
        AND (
                s.created_on         > ?
             OR s.last_edited        > ?
             OR s.end_timestamp      > ?
             OR r.time_of_submission > ?
        )
        ORDER BY s.created_on ASC
        """;

        return jdbcTemplate.query(
                sql,
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
