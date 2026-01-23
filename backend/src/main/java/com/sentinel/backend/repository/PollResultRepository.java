package com.sentinel.backend.repository;

import com.sentinel.backend.entity.PollResult;
import com.sentinel.backend.entity.PollResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

import static com.sentinel.backend.constant.Queries.DELETE_BY_SIGNAL_ID_AND_USER_EMAILS;
import static com.sentinel.backend.constant.Queries.DELETE_POLL_RESULTS_BY_SIGNAL_ID;

public interface PollResultRepository extends JpaRepository<PollResult, PollResultId> {

    List<PollResult> findByIdSignalId(Long signalId);

    @Modifying
    @Query(
            value = DELETE_BY_SIGNAL_ID_AND_USER_EMAILS,
            nativeQuery = true
    )
    void deleteBySignalIdAndUserEmails(
            @Param("signalId") Long signalId,
            @Param("userEmails") Set<String> userEmails
    );

    @Modifying
    @Query(
            value = DELETE_POLL_RESULTS_BY_SIGNAL_ID,
            nativeQuery = true
    )
    void deleteBySignalId(@Param("signalId") Long signalId);

}
