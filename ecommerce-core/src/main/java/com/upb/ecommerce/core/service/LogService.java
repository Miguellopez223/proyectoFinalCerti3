package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.response.LogResponse;
import com.upb.ecommerce.data.repository.LogRepository;
import com.upb.ecommerce.domain.entities.Log;
import com.upb.ecommerce.domain.enums.LogLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
public class LogService {

    private final LogRepository logRepository;

    public LogService(LogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void infoTx(String message) {
        log.info("INFO: " + message);

        logRepository.save(Log.builder()
                .level(LogLevel.INFO)
                .message(message)
                .build());
    }

    @Async
    @Transactional
    public void info(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.INFO)
                .message(message)
                .build());
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void errorTx(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.ERROR)
                .message(message)
                .build());
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void warning(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.WARNING)
                .message(message)
                .build());
    }

    @Async
    @Transactional
    public void deleteAll() {
        logRepository.deleteAll();
    }

    @Transactional(readOnly = true)
    public Page<LogResponse> findAllByOrderByDateDesc(LocalDateTime pInit, LocalDateTime pEnd, Pageable pageable) {
        return logRepository.findAllByOrderByDateDesc(pInit, pEnd, pageable)
                .map(LogResponse::fromEntity);
    }
}
