package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "poll_result")
@Data
public class PollResult {

    @EmbeddedId
    private PollResultId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("signalId")
    @JoinColumn(name = "signal_id")
    private Signal signal;

    @Column(name = "selected_options", columnDefinition = "text[]")
    private String[] selectedOptions;

    @Column(name = "default_response")
    private String defaultResponse;

    @Column(name = "reason")
    private String reason;

    @Column(
            name = "time_of_submission",
            nullable = false,
            updatable = false
    )
    private Instant timeOfSubmission;

}
