package com.sentinel.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Embeddable
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PollResultId implements Serializable {

    @Column(name = "signal_id", nullable = false)
    private Long signalId;

    @Column(name = "user_email", nullable = false)
    private String userEmail;
}
