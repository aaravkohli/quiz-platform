package com.quizplatform.models;

import lombok.Data;
import java.util.List;

@Data
public class Question {
    private Long id;
    private Long quizId;
    private String questionText;
    private QuestionType type;
    private List<Answer> answers;
    private Integer points;
    private Integer order;

    public enum QuestionType {
        MULTIPLE_CHOICE,
        TRUE_FALSE,
        SHORT_ANSWER
    }
} 