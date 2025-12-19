package com.sentinel.backend.repository;

import com.sentinel.backend.dto.response.ActivePollDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class ActivePollRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<ActivePollDTO> findActivePollsForUser(String userId) {

        String sql = """
            SELECT
                s.id AS signal_id,
                p.question,
                p.options,
                s.end_timestamp,
                s.anonymous,
                s.default_option,
                s.default_flag,
                s.created_by AS publisher,
                s.persistent_alert AS persistent_alert
            FROM signal s
            JOIN poll p ON p.signal_id = s.id
            WHERE s.status = 'ACTIVE'
              AND s.end_timestamp > (NOW() AT TIME ZONE 'UTC')
              AND ? = ANY (s.shared_with)
              AND NOT EXISTS (
                  SELECT 1
                  FROM poll_result r
                  WHERE r.signal_id = s.id
                    AND r.user_id = ?
              )
            ORDER BY s.end_timestamp ASC
        """;

        return jdbcTemplate.query(
                sql,
                (rs, i) -> {
                    var array = rs.getArray("options");
                    String[] options = array != null
                            ? (String[]) array.getArray()
                            : new String[0];

                    return new ActivePollDTO(
                            rs.getInt("signal_id"),
                            rs.getString("question"),
                            options,
                            rs.getTimestamp("end_timestamp").toInstant(),
                            rs.getBoolean("anonymous"),
                            rs.getString("default_option"),
                            rs.getBoolean("default_flag"),
                            rs.getString("publisher"),
                            rs.getBoolean("persistent_alert")
                    );
                },
                userId,
                userId
        );
    }
}
