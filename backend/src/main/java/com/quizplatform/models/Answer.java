package com.quizplatform.models;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class Answer {
    private Long id;
    private Long questionId;
    private String answerText;
    private Boolean isCorrect;
    
    @JsonProperty("order")
    private Integer answerOrder;
} 