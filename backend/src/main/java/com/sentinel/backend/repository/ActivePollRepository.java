package com.sentinel.backend.repository;

import com.sentinel.backend.dto.response.ActivePollDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.sentinel.backend.constant.Queries.FIND_ACTIVE_POLLS_FOR_USER;

@Repository
@RequiredArgsConstructor
public class ActivePollRepository {

    private final JdbcTemplate jdbcTemplate;

    public List<ActivePollDTO> findActivePollsForUser(String userId) {

        return jdbcTemplate.query(
                FIND_ACTIVE_POLLS_FOR_USER,
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
