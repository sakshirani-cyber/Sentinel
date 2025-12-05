package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Integer> {
    @Query("SELECT p FROM Poll p WHERE LOWER(p.question) = LOWER(:question)")
    List<Poll> findByQuestionCaseInsensitive(@Param("question") String question);
}
