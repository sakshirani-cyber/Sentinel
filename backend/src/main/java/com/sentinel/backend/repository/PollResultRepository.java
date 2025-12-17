package com.sentinel.backend.repository;

import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.PollResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PollResultRepository extends JpaRepository<PollResult, PollResultId> {

    List<PollResult> findByIdSignalId(Integer signalId);

    void deleteByIdSignalId(Integer signalId);
}
