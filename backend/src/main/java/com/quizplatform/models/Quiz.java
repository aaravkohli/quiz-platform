package com.quizplatform.models;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Quiz {
    private Long id;
    private String title;
    private String description;
    private Long instructorId;
    private Integer timeLimit; // in minutes
    private Boolean isPublished;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Question> questions;
} 