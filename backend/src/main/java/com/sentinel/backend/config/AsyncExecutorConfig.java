package com.sentinel.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import java.util.concurrent.Executor;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableAsync
public class AsyncExecutorConfig {

    @Value("${executor.core-pool-size:20}")
    private int corePoolSize;

    @Value("${executor.max-pool-size:100}")
    private int maxPoolSize;

    @Value("${executor.queue-capacity:1000}")
    private int queueCapacity;

    @Value("${executor.thread-name-prefix:async-executor-}")
    private String threadNamePrefix;

    @Bean(name = "asyncExecutor")
    public Executor asyncExecutor() {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(queueCapacity),
                new ThreadPoolExecutor.CallerRunsPolicy()
        );

        executor.allowCoreThreadTimeOut(true);

        executor.setThreadFactory(r -> {
            Thread thread = new Thread(r);
            thread.setName(threadNamePrefix + thread.getId());
            thread.setDaemon(false);
            return thread;
        });

        return executor;
    }
}