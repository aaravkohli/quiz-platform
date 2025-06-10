package com.quizplatform.repositories;

import com.quizplatform.Main;
import com.quizplatform.models.Answer;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class AnswerRepository implements BaseRepository<Answer> {
    public AnswerRepository() {}

    @Override
    public Answer create(Answer answer) {
        String sql = "INSERT INTO answers (question_id, answer_text, is_correct, answer_order) VALUES (?, ?, ?, ?)";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, answer.getQuestionId());
            stmt.setString(2, answer.getAnswerText());
            stmt.setBoolean(3, Boolean.TRUE.equals(answer.getIsCorrect()));
            stmt.setInt(4, answer.getAnswerOrder());
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    answer.setId(rs.getLong(1));
                }
            }
            return answer;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating answer", e);
        }
    }

    @Override
    public Optional<Answer> findById(Long id) {
        String sql = "SELECT * FROM answers WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToAnswer(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding answer", e);
        }
    }

    public List<Answer> findByQuestionId(Long questionId) {
        String sql = "SELECT * FROM answers WHERE question_id = ? ORDER BY answer_order";
        List<Answer> answers = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, questionId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    answers.add(mapResultSetToAnswer(rs));
                }
            }
            return answers;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding answers by question", e);
        }
    }

    @Override
    public List<Answer> findAll() {
        String sql = "SELECT * FROM answers ORDER BY answer_order";
        List<Answer> answers = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                answers.add(mapResultSetToAnswer(rs));
            }
            return answers;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding all answers", e);
        }
    }

    @Override
    public Answer update(Answer answer) {
        String sql = "UPDATE answers SET answer_text = ?, is_correct = ?, answer_order = ? WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, answer.getAnswerText());
            stmt.setBoolean(2, answer.getIsCorrect());
            stmt.setInt(3, answer.getAnswerOrder());
            stmt.setLong(4, answer.getId());
            
            stmt.executeUpdate();
            return answer;
        } catch (SQLException e) {
            throw new RuntimeException("Error updating answer", e);
        }
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM answers WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting answer", e);
        }
    }

    private Answer mapResultSetToAnswer(ResultSet rs) throws SQLException {
        Answer answer = new Answer();
        answer.setId(rs.getLong("id"));
        answer.setQuestionId(rs.getLong("question_id"));
        answer.setAnswerText(rs.getString("answer_text"));
        answer.setIsCorrect(rs.getBoolean("is_correct"));
        answer.setAnswerOrder(rs.getInt("answer_order"));
        return answer;
    }
} 