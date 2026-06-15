package com.upb.ecommerce.domain.entities;

import com.upb.ecommerce.domain.enums.LogLevel;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "log")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Log {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "_level", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private LogLevel level;

    @Column(name = "_message", nullable = false, length = 4000)
    private String message;

    @Column(name = "created_date", nullable = false)
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();
}
