package com.sentinel.backend.repository;

import com.sentinel.backend.entity.PollAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PollAssignmentRepository extends JpaRepository<PollAssignment, Integer> {
    List<PollAssignment> findByUserEmailOrderByAssignedAtDesc(String userEmail);
    List<PollAssignment> findBySignalId(Integer signalId);
    Optional<PollAssignment> findBySignalIdAndUserEmail(Integer signalId, String userEmail);
}
