package com.sentinel.backend.repository;

import com.sentinel.backend.entity.LabelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabelRepository extends JpaRepository<LabelEntity, Long> {

    boolean existsByLabel(String label);
}
