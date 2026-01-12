package com.sentinel.backend.repository;

import com.sentinel.backend.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    boolean existsByLabel(String label);
}
