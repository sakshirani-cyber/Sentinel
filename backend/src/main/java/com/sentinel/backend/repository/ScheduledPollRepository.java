package com.sentinel.backend.repository;

import com.sentinel.backend.entity.ScheduledPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledPollRepository extends JpaRepository<ScheduledPoll, Long> {

    @Query("SELECT sp FROM ScheduledPoll sp WHERE sp.scheduledTime > :now")
    List<ScheduledPoll> findAllPendingSchedules(Instant now);

    boolean existsById(Long id);

    Optional<ScheduledPoll> findByReservedSignalId(Long reservedSignalId);
}