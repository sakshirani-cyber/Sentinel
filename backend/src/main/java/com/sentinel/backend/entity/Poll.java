package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    @Column(name = "signal_id")
    private Integer signalId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "signal_id")
    private Signal signal;

    private String question;

    @Column(columnDefinition = "text[]")
    private String[] options;

    @Column(name = "default_option")
    private String defaultOption;
}
