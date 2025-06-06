package com.quizplatform.models;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QuizAttempt {
    private Long id;
    private Long quizId;
    private Long studentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer score;
    private Integer maxScore;
    private QuizAttemptStatus status;

    public enum QuizAttemptStatus {
        IN_PROGRESS,
        COMPLETED,
        TIMED_OUT
    }
} 