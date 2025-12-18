package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "signal")
@Data
public class Signal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_on", nullable = false, updatable = false)
    private Instant createdOn;

    @Column(name = "last_edited")
    private Instant lastEdited;

    private Boolean anonymous = false;

    @Column(name = "end_timestamp", nullable = false)
    private Instant endTimestamp;

    @Column(name = "type_of_signal", nullable = false)
    private String typeOfSignal;

    @Column(name = "default_flag")
    private Boolean defaultFlag = false;

    @Column(name = "default_option")
    private String defaultOption;

    @Column(name = "shared_with", columnDefinition = "text[]", nullable = false)
    private String[] sharedWith;

    private String status = "ACTIVE";
}
