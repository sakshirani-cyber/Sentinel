package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Poll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PollRepository extends JpaRepository<Poll, Integer> {

    @Query("""
        select p
        from Poll p
        join p.signal s
        where lower(trim(p.question)) = :question
          and s.status = 'ACTIVE'
    """)
    List<Poll> findActivePollsByQuestion(
            @Param("question") String normalizedQuestion
    );
}
