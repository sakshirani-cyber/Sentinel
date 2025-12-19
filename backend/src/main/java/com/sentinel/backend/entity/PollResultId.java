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

    @Column(name = "signal_id")
    private Integer signalId;

    @Column(name = "user_id")
    private String userId;
}
