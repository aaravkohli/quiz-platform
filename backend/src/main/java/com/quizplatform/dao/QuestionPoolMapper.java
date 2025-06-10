package com.quizplatform.dao;

import com.quizplatform.models.QuestionPool;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;

public class QuestionPoolMapper implements RowMapper<QuestionPool> {
    @Override
    public QuestionPool map(ResultSet rs, StatementContext ctx) throws SQLException {
        QuestionPool pool = new QuestionPool();
        pool.setId(rs.getInt("id"));
        pool.setName(rs.getString("name"));
        pool.setDescription(rs.getString("description"));
        pool.setInstructorId(rs.getInt("instructor_id"));
        pool.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        pool.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
        return pool;
    }
} 