package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "scheduled_poll")
@Data
public class ScheduledPoll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long reservedSignalId;

    @Column(nullable = false)
    private String question;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String[] options;

    @Column(nullable = false)
    private String createdBy;

    @Column(nullable = false)
    private Boolean anonymous;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String[] sharedWith;

    @Column(nullable = false)
    private Boolean defaultFlag;

    private String defaultOption;

    @Column(nullable = false)
    private Instant scheduledTime;

    private Instant endTimestamp;

    @Column(nullable = false)
    private Boolean persistentAlert;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String[] labels;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}