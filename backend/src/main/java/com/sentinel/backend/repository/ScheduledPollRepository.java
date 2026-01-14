package com.sentinel.backend.repository;

import com.sentinel.backend.entity.ScheduledPoll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.sentinel.backend.constant.Queries.FETCH_ALL_SCHEDULED_POLL;

@Repository
public interface ScheduledPollRepository extends JpaRepository<ScheduledPoll, Long> {

    @Query(
            value = FETCH_ALL_SCHEDULED_POLL,
            nativeQuery = true
    )
    List<ScheduledPoll> findAllPendingSchedules(Instant now);

    Optional<ScheduledPoll> findByReservedSignalId(Long reservedSignalId);
}