package com.sentinel.backend.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;

@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncPollDbService {

    private final ExecutorService asyncExecutor;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public void asyncInsert(String userEmail, SseEvent<?> event) {
        asyncExecutor.submit(() -> {
            try {
                String payloadJson = objectMapper.writeValueAsString(event.getPayload());

                jdbcTemplate.update(
                        """
                        INSERT INTO sse_pending_event (user_email, event_type, payload, created_at)
                        VALUES (?, ?, ?, ?)
                        """,
                        userEmail,
                        event.getEventType(),
                        payloadJson,
                        Timestamp.from(event.getEventTime())
                );

                log.info(
                        "[DB][ASYNC][INSERT] success | userEmail={} | eventType={}",
                        userEmail,
                        event.getEventType()
                );

            } catch (Exception ex) {
                log.error(
                        "[DB][ASYNC][INSERT][ERROR] userEmail={} | reason={}",
                        userEmail,
                        ex.getMessage(),
                        ex
                );
            }
        });
    }

    public void asyncDelete(String userEmail) {
        asyncExecutor.submit(() -> {
            try {
                int deleted = jdbcTemplate.update(
                        """
                        DELETE FROM sse_pending_event
                        WHERE user_email = ?
                        """,
                        userEmail
                );

                log.info(
                        "[DB][ASYNC][DELETE] success | userEmail={} | rowsDeleted={}",
                        userEmail,
                        deleted
                );

            } catch (Exception ex) {
                log.error(
                        "[DB][ASYNC][DELETE][ERROR] userEmail={} | reason={}",
                        userEmail,
                        ex.getMessage(),
                        ex
                );
            }
        });
    }

    public List<SseEvent<?>> loadPending(String userEmail) {
        try {
            return jdbcTemplate.query(
                    """
                    SELECT event_type, payload, created_at
                    FROM sse_pending_event
                    WHERE user_email = ?
                    ORDER BY id ASC
                    """,
                    rs -> {
                        List<SseEvent<?>> list = new ArrayList<>();
                        while (rs.next()) {
                            try {
                                String eventType = rs.getString("event_type");
                                String payloadJson = rs.getString("payload");
                                Instant createdAt = rs.getTimestamp("created_at").toInstant();
                                Object payload = objectMapper.readValue(payloadJson, Object.class);
                                list.add(new SseEvent<>(eventType, createdAt, payload));
                            } catch (Exception ignored) {
                                log.warn("[DB][LOAD] Failed to parse event for user={}", userEmail);
                            }
                        }
                        return list;
                    },
                    userEmail
            );
        } catch (Exception ex) {
            log.error("[DB][LOAD][ERROR] userEmail={} | reason={}", userEmail, ex.getMessage(), ex);
            return new ArrayList<>();
        }
    }

    public void asyncBatchInsert(String[] userEmails, SseEvent<?> event) {
        if (userEmails == null || userEmails.length == 0) {
            return;
        }

        asyncExecutor.submit(() -> {
            try {
                long startTime = System.currentTimeMillis();

                String payloadJson = objectMapper.writeValueAsString(event.getPayload());
                Timestamp timestamp = Timestamp.from(event.getEventTime());

                int batchSize = 100;
                int totalUsers = userEmails.length;
                int totalInserted = 0;

                for (int i = 0; i < totalUsers; i += batchSize) {
                    int endIndex = Math.min(i + batchSize, totalUsers);
                    int currentBatchSize = endIndex - i;

                    String sql = """
                        INSERT INTO sse_pending_event (user_email, event_type, payload, created_at)
                        VALUES (?, ?, ?, ?)
                        """;

                    List<Object[]> batchArgs = new ArrayList<>();
                    for (int j = i; j < endIndex; j++) {
                        batchArgs.add(new Object[]{
                                userEmails[j],
                                event.getEventType(),
                                payloadJson,
                                timestamp
                        });
                    }

                    int[] results = jdbcTemplate.batchUpdate(sql, batchArgs);
                    totalInserted += results.length;

                    log.debug(
                            "[DB][BATCH][INSERT] Batch {}/{} | inserted={} users",
                            (i / batchSize) + 1,
                            (totalUsers + batchSize - 1) / batchSize,
                            currentBatchSize
                    );
                }

                long duration = System.currentTimeMillis() - startTime;

                log.info(
                        "[DB][BATCH][INSERT] success | totalUsers={} | inserted={} | durationMs={} | avgPerUser={}ms",
                        totalUsers,
                        totalInserted,
                        duration,
                        totalUsers > 0 ? duration / totalUsers : 0
                );

            } catch (Exception ex) {
                log.error(
                        "[DB][BATCH][INSERT][ERROR] users={} | reason={}",
                        userEmails.length,
                        ex.getMessage(),
                        ex
                );
            }
        });
    }

    public void asyncBatchDelete(String[] userEmails) {
        if (userEmails == null || userEmails.length == 0) {
            return;
        }

        asyncExecutor.submit(() -> {
            try {
                long startTime = System.currentTimeMillis();

                String placeholders = String.join(",", "?".repeat(userEmails.length).split(""));

                String sql = String.format(
                        "DELETE FROM sse_pending_event WHERE user_email IN (%s)",
                        placeholders
                );

                int deleted = jdbcTemplate.update(sql, (Object[]) userEmails);

                long duration = System.currentTimeMillis() - startTime;

                log.info(
                        "[DB][BATCH][DELETE] success | totalUsers={} | rowsDeleted={} | durationMs={}",
                        userEmails.length,
                        deleted,
                        duration
                );

            } catch (Exception ex) {
                log.error(
                        "[DB][BATCH][DELETE][ERROR] users={} | reason={}",
                        userEmails.length,
                        ex.getMessage(),
                        ex
                );
            }
        });
    }
}