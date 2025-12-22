package com.sentinel.backend.constant;

public class Queries {
    public static final String GET_ROLE_BY_EMAIL_AND_PASSWORD = "SELECT role FROM users WHERE email = ? AND password = ?";
    public static final String FIND_ACTIVE_POLLS_FOR_USER = """
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

    public static final String FIND_ACTIVE_POLL_BY_QUESTION = """
    SELECT p
    FROM Poll p
    JOIN p.signal s
    WHERE LOWER(TRIM(p.question)) = :question
      AND s.status = 'ACTIVE'
    """;
}
