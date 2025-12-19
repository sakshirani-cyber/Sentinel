package com.sentinel.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager cacheManager() {

        CaffeineCacheManager cacheManager =
                new CaffeineCacheManager("activePolls");

        cacheManager.setAllowNullValues(false);
        cacheManager.setCaffeine(caffeineSpec());

        return cacheManager;
    }

    @Bean
    public Caffeine<Object, Object> caffeineSpec() {
        return Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.SECONDS)
                .maximumSize(10_000)
                .initialCapacity(1_000)
                .recordStats();
    }
}
