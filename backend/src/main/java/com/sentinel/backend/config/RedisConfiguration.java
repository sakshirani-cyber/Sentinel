package com.sentinel.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.resource.DefaultClientResources;
import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@Slf4j
public class RedisConfiguration {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration COMMAND_TIMEOUT = Duration.ofSeconds(2);
    private static final int IO_THREAD_POOL_SIZE = 16;
    private static final int COMPUTATION_THREAD_POOL_SIZE = 8;

    @Value("${spring.data.redis.master.host}")
    private String masterHost;

    @Value("${spring.data.redis.master.port}")
    private int masterPort;

    @Value("${spring.data.redis.master.password:}")
    private String masterPassword;

    @Value("${spring.data.redis.slave.host}")
    private String slaveHost;

    @Value("${spring.data.redis.slave.port}")
    private int slavePort;

    @Value("${spring.data.redis.slave.password:}")
    private String slavePassword;

    @Bean(destroyMethod = "shutdown")
    public ClientResources clientResources() {
        return DefaultClientResources.builder()
                .ioThreadPoolSize(IO_THREAD_POOL_SIZE)
                .computationThreadPoolSize(COMPUTATION_THREAD_POOL_SIZE)
                .build();
    }

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        
        String address = String.format("rediss://%s:%d", masterHost, masterPort);
        
        config.useSingleServer()
                .setAddress(address)
                .setPassword(masterPassword)
                .setDatabase(0)
                .setConnectionPoolSize(64)
                .setConnectionMinimumIdleSize(10)
                .setConnectTimeout(10000)
                .setTimeout(3000)
                .setRetryAttempts(3)
                .setRetryInterval(1500)
                .setSubscriptionsPerConnection(5)
                .setClientName("sentinel-redisson")
                .setKeepAlive(true)
                .setTcpNoDelay(true);

        config.setThreads(16);
        config.setNettyThreads(32);
        config.setLockWatchdogTimeout(30000);
        config.setKeepPubSubOrder(true);

        log.info("[REDIS][REDISSON] Configured | host={}:{}", masterHost, masterPort);
        
        return Redisson.create(config);
    }

    @Bean
    @Primary
    public LettuceConnectionFactory redisConnectionFactory(ClientResources clientResources) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(masterHost, masterPort);
        if (masterPassword != null && !masterPassword.isEmpty()) {
            config.setPassword(masterPassword);
        }

        ClientOptions clientOptions = buildClientOptions();

        LettuceClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .clientOptions(clientOptions)
                .clientResources(clientResources)
                .commandTimeout(COMMAND_TIMEOUT)
                .useSsl()
                .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientConfig);
        factory.setValidateConnection(true);
        factory.setShareNativeConnection(false);

        log.info("[REDIS][CONFIG] Connection factory configured (SSL enabled) | host={}:{}", masterHost, masterPort);
        return factory;
    }

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisMasterTemplate(
            LettuceConnectionFactory redisConnectionFactory,
            ObjectMapper redisObjectMapper) {
        log.info("[REDIS][CONFIG] Master template created for WRITES");
        return buildRedisTemplate(redisConnectionFactory, redisObjectMapper);
    }

    @Bean
    public RedisTemplate<String, Object> redisSlaveTemplate(
            LettuceConnectionFactory redisConnectionFactory,
            ObjectMapper redisObjectMapper) {
        log.info("[REDIS][CONFIG] Slave template created for READS");
        return buildRedisTemplate(redisConnectionFactory, redisObjectMapper);
    }

    private ClientOptions buildClientOptions() {
        return ClientOptions.builder()
                .socketOptions(SocketOptions.builder()
                        .connectTimeout(CONNECT_TIMEOUT)
                        .keepAlive(true)
                        .build())
                .timeoutOptions(TimeoutOptions.enabled(COMMAND_TIMEOUT))
                .build();
    }

    private RedisTemplate<String, Object> buildRedisTemplate(
            LettuceConnectionFactory connectionFactory,
            ObjectMapper objectMapper) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.setEnableTransactionSupport(false);
        template.afterPropertiesSet();

        return template;
    }
}