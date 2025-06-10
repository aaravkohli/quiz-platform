package com.quizplatform.dao;

import com.quizplatform.models.Question;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

public class QuestionMapper implements RowMapper<Question> {
    @Override
    public Question map(ResultSet rs, StatementContext ctx) throws SQLException {
        Question question = new Question();
        question.setId(rs.getLong("id"));
        question.setQuizId(rs.getLong("quiz_id"));
        question.setQuestionText(rs.getString("question_text"));
        question.setType(Question.QuestionType.valueOf(rs.getString("question_type")));
        question.setTimeLimit(rs.getInt("time_limit"));
        question.setFileUploadUrl(rs.getString("file_upload_url"));
        question.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        question.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return question;
    }
} 