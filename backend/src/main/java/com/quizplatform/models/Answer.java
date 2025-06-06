package com.quizplatform.models;

import lombok.Data;

@Data
public class Answer {
    private Long id;
    private Long questionId;
    private String answerText;
    private Boolean isCorrect;
    private Integer order;
} 