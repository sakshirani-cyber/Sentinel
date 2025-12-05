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
@Table(name = "poll_result")
@Data
public class PollResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "signal_id")
    private Integer signalId;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "selected_option")
    private String selectedOption;

    @Column(name = "time_of_submission")
    private LocalDateTime timeOfSubmission = LocalDateTime.now();
}
