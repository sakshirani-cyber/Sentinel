package com.sentinel.backend.sse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.backend.sse.dto.SseEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;

@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncPollDbService {

    private final ExecutorService asyncExecutor;
    private final PollSyncCache pollSyncCache;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public void asyncInsert(String userEmail, SseEvent<?> event) {

        asyncExecutor.submit(() -> {
            try {
                String payloadJson = objectMapper.writeValueAsString(event.getPayload());

                jdbcTemplate.update(
                        """
                        INSERT INTO sse_pending_event (user_email, event_type, payload)
                        VALUES (?, ?, ?)
                        """,
                        userEmail,
                        event.getEventType(),
                        payloadJson
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

    public void asyncReload(String userEmail) {

        asyncExecutor.submit(() -> {
            try {
                List<SseEvent<?>> events = jdbcTemplate.query(
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

                                } catch (Exception ex) {
                                    log.error(
                                            "[DB][ASYNC][RELOAD][SKIP] Corrupted payload skipped | reason={}",
                                            ex.getMessage()
                                    );
                                }
                            }
                            return list;
                        },
                        userEmail
                );

                if (!events.isEmpty()) {
                    pollSyncCache.put(userEmail, events);

                    log.info(
                            "[DB][ASYNC][RELOAD] success | userEmail={} | eventsLoaded={}",
                            userEmail,
                            events.size()
                    );
                } else {
                    log.info(
                            "[DB][ASYNC][RELOAD] no pending events | userEmail={}",
                            userEmail
                    );
                }

            } catch (Exception ex) {
                log.error(
                        "[DB][ASYNC][RELOAD][ERROR] userEmail={} | reason={}",
                        userEmail,
                        ex.getMessage(),
                        ex
                );
            }
        });
    }
}
