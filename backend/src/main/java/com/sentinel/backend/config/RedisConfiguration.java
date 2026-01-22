package com.sentinel.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.ReadFrom;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import io.lettuce.core.resource.ClientResources;
import io.lettuce.core.resource.DefaultClientResources;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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

    @Bean
    @Primary
    public LettuceConnectionFactory redisMasterConnectionFactory(ClientResources clientResources) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(masterHost, masterPort);
        if (masterPassword != null && !masterPassword.isEmpty()) {
            config.setPassword(masterPassword);
        }

        ClientOptions clientOptions = buildClientOptions();

        LettuceClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .clientOptions(clientOptions)
                .clientResources(clientResources)
                .commandTimeout(COMMAND_TIMEOUT)
                .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientConfig);
        factory.setValidateConnection(true);
        factory.setShareNativeConnection(false);

        log.info("[REDIS][CONFIG] Master configured | host={}:{}", masterHost, masterPort);
        return factory;
    }

    @Bean
    public LettuceConnectionFactory redisSlaveConnectionFactory(ClientResources clientResources) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(slaveHost, slavePort);
        if (slavePassword != null && !slavePassword.isEmpty()) {
            config.setPassword(slavePassword);
        }

        ClientOptions clientOptions = buildClientOptions();

        LettuceClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .clientOptions(clientOptions)
                .clientResources(clientResources)
                .commandTimeout(COMMAND_TIMEOUT)
                .readFrom(ReadFrom.REPLICA_PREFERRED)
                .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientConfig);
        factory.setValidateConnection(true);
        factory.setShareNativeConnection(false);

        log.info("[REDIS][CONFIG] Slave configured | host={}:{}", slaveHost, slavePort);
        return factory;
    }

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisMasterTemplate(
            @Qualifier("redisMasterConnectionFactory") LettuceConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {
        return buildRedisTemplate(connectionFactory, redisObjectMapper);
    }

    @Bean
    public RedisTemplate<String, Object> redisSlaveTemplate(
            @Qualifier("redisSlaveConnectionFactory") LettuceConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {
        return buildRedisTemplate(connectionFactory, redisObjectMapper);
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