package com.upb.ecommerce.core.dto.response;

import com.upb.ecommerce.domain.entities.Log;
import com.upb.ecommerce.domain.enums.LogLevel;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LogResponse {

    private Long id;
    private LogLevel level;
    private String message;
    private LocalDateTime createdDate;

    public static LogResponse fromEntity(Log log) {
        LogResponse response = new LogResponse();
        response.setId(log.getId());
        response.setLevel(log.getLevel());
        response.setMessage(log.getMessage());
        response.setCreatedDate(log.getCreatedDate());
        return response;
    }
}
