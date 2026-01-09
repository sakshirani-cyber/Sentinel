package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import static com.sentinel.backend.constant.Queries.DELETE_POLL_BY_SIGNAL_ID;

public interface PollRepository extends JpaRepository<Poll, Long> {

    @Modifying
    @Query(DELETE_POLL_BY_SIGNAL_ID)
    int deleteBySignalId(@Param("signalId") Long signalId);
}
