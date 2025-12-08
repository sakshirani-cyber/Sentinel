package com.sentinel.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "poll")
@Data
public class Poll {

    @Id
    @Column(name = "signal_id")
    private Integer signalId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "signal_id")
    private Signal signal;

    @Column(nullable = false)
    private String question;

    @Column(name = "options", columnDefinition = "text[]", nullable = false)
    private String[] options;
}
