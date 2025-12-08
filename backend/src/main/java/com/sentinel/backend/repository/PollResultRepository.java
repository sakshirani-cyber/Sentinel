package com.sentinel.backend.repository;

import com.sentinel.backend.entity.PollResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PollResultRepository extends JpaRepository<PollResult, Integer> {
    List<PollResult> findBySignalId(Integer signalId);
    Optional<PollResult> findBySignalIdAndUserId(Integer signalId, String userId);
    long countBySignalId(Integer signalId);
}
