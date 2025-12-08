package com.sentinel.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "poll_result", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"signal_id", "user_id"})
})
@Data
public class PollResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "signal_id")
    private Integer signalId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "selected_option", nullable = false)
    private String selectedOption;

    @Column(name = "time_of_submission", nullable = false)
    private Instant timeOfSubmission = Instant.now();
}
