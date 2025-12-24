package com.sentinel.backend.constant;

public class Queries {
    public static final String GET_ROLE_BY_EMAIL_AND_PASSWORD = "SELECT role FROM users WHERE email = ? AND password = ?";

    public static final String FIND_ACTIVE_POLL_BY_QUESTION = """
    SELECT p
    FROM Poll p
    JOIN p.signal s
    WHERE LOWER(TRIM(p.question)) = :question
      AND s.status = 'ACTIVE'
    """;
}
