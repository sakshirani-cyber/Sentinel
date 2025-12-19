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

    public List<ActivePollDTO> findActivePollsForUser(String userEmail) {

        String sql = """
            SELECT
                s.id AS signal_id,
                p.question,
                p.options,
                s.end_timestamp,
                s.anonymous
            FROM signal s
            JOIN poll p ON p.signal_id = s.id
            WHERE s.status = 'ACTIVE'
              AND s.end_timestamp > NOW()
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
                (rs, i) -> new ActivePollDTO(
                        rs.getInt("signal_id"),
                        rs.getString("question"),
                        (String[]) rs.getArray("options").getArray(),
                        rs.getTimestamp("end_timestamp").toInstant(),
                        rs.getBoolean("anonymous")
                ),
                userEmail,
                userEmail
        );
    }
}
