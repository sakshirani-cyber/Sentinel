package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import static com.sentinel.backend.constant.Queries.FIND_ACTIVE_POLL_BY_QUESTION;

public interface PollRepository extends JpaRepository<Poll, Integer> {

    @Query(FIND_ACTIVE_POLL_BY_QUESTION)
    List<Poll> findActivePollsByQuestion(
            @Param("question") String normalizedQuestion
    );
}
