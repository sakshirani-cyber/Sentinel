package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Signal;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignalRepository extends JpaRepository<Signal, Integer> {
}
