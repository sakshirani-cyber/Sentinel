package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "poll")
@Data
public class Poll {

    @Id
    @Column(name = "signal_id", nullable = false)
    private Long signalId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "signal_id")
    private Signal signal;

    @Column(name = "question", nullable = false)
    private String question;

    @Column(name = "options", columnDefinition = "text[]", nullable = false)
    private String[] options;
}
