package com.sentinel.backend.constant;

public class Queries {
    public static final String GET_ROLE_BY_EMAIL_AND_PASSWORD = "SELECT role FROM users WHERE user_email = ? AND password = ?";

    public static final String DATA_SYNC_SQL = """
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
        FROM
            signal s
        JOIN
            poll p ON p.signal_id = s.id
        LEFT JOIN
            poll_result r
        ON
            r.signal_id = s.id
        AND
            r.user_email = ?
        WHERE
            (
                s.created_by = ?
                OR
                ? = ANY (s.shared_with)
            )
        ORDER BY s.created_on ASC
        """;

    public static final String DELETE_BY_SIGNAL_ID_AND_USER_EMAILS = """
        DELETE
            FROM poll_result
        WHERE
            signal_id = :signalId
        AND
            user_email IN (:userEmails)
        """;

    public static final String UPDATE_SIGNAL_STATUS = """
        UPDATE Signal s
        SET s.status = :status
        WHERE s.id = :signalId
        """;

    public static final String DELETE_POLL_BY_SIGNAL_ID = """
        DELETE FROM Poll p
        WHERE p.signal.id = :signalId
        """;

    public static final String DELETE_POLL_RESULTS_BY_SIGNAL_ID = """
        DELETE FROM PollResult pr
        WHERE pr.signal.id = :signalId
        """;
}
