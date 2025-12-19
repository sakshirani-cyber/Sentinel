package com.sentinel.backend.service;

import com.sentinel.backend.dto.response.ActivePollDTO;
import com.sentinel.backend.repository.ActivePollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivePollService {

    private final ActivePollRepository activePollRepository;

    @Cacheable(
            value = "activePolls",
            key = "#userEmail"
    )
    public List<ActivePollDTO> getActivePollsForUser(String userEmail) {
        return activePollRepository.findActivePollsForUser(userEmail);
    }

    @CacheEvict(
            value = "activePolls",
            key = "#userEmail"
    )
    public void evictUserCache(String userEmail) {
    }
}
