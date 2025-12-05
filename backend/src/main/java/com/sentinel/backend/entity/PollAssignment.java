package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "poll_assignment")
@Data
public class PollAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "signal_id")
    private Integer signalId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt = LocalDateTime.now();

    private Boolean seen = false;

    private Boolean submitted = false;
}
