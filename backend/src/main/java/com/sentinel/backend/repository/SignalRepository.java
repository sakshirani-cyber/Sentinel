package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Signal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import static com.sentinel.backend.constant.Queries.UPDATE_SIGNAL_STATUS;

public interface SignalRepository extends JpaRepository<Signal, Integer> {

    @Modifying
    @Query(UPDATE_SIGNAL_STATUS)
    int updateSignalStatus(
            @Param("signalId") Integer signalId,
            @Param("status") String status
    );
}
