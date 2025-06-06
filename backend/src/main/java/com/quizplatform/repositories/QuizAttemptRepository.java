package com.quizplatform.repositories;

import com.quizplatform.Main;
import com.quizplatform.models.QuizAttempt;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class QuizAttemptRepository implements BaseRepository<QuizAttempt> {
    public QuizAttemptRepository() {}

    @Override
    public QuizAttempt create(QuizAttempt attempt) {
        String sql = "INSERT INTO quiz_attempts (quiz_id, student_id, start_time, status) VALUES (?, ?, ?, ?)";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, attempt.getQuizId());
            stmt.setLong(2, attempt.getStudentId());
            stmt.setTimestamp(3, Timestamp.valueOf(attempt.getStartTime()));
            stmt.setString(4, attempt.getStatus().name());
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    attempt.setId(rs.getLong(1));
                }
            }
            return attempt;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating quiz attempt", e);
        }
    }

    @Override
    public Optional<QuizAttempt> findById(Long id) {
        String sql = "SELECT * FROM quiz_attempts WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToQuizAttempt(rs));
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz attempt", e);
        }
    }

    public List<QuizAttempt> findByStudentId(Long studentId) {
        String sql = "SELECT * FROM quiz_attempts WHERE student_id = ? ORDER BY start_time DESC";
        List<QuizAttempt> attempts = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    attempts.add(mapResultSetToQuizAttempt(rs));
                }
            }
            return attempts;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz attempts by student", e);
        }
    }

    public List<QuizAttempt> findByQuizId(Long quizId) {
        String sql = "SELECT * FROM quiz_attempts WHERE quiz_id = ? ORDER BY start_time DESC";
        List<QuizAttempt> attempts = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    attempts.add(mapResultSetToQuizAttempt(rs));
                }
            }
            return attempts;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz attempts by quiz", e);
        }
    }

    @Override
    public List<QuizAttempt> findAll() {
        String sql = "SELECT * FROM quiz_attempts ORDER BY start_time DESC";
        List<QuizAttempt> attempts = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                attempts.add(mapResultSetToQuizAttempt(rs));
            }
            return attempts;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding all quiz attempts", e);
        }
    }

    @Override
    public QuizAttempt update(QuizAttempt attempt) {
        String sql = "UPDATE quiz_attempts SET end_time = ?, score = ?, max_score = ?, status = ? WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setTimestamp(1, attempt.getEndTime() != null ? Timestamp.valueOf(attempt.getEndTime()) : null);
            stmt.setInt(2, attempt.getScore());
            stmt.setInt(3, attempt.getMaxScore());
            stmt.setString(4, attempt.getStatus().name());
            stmt.setLong(5, attempt.getId());
            
            stmt.executeUpdate();
            return attempt;
        } catch (SQLException e) {
            throw new RuntimeException("Error updating quiz attempt", e);
        }
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM quiz_attempts WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting quiz attempt", e);
        }
    }

    private QuizAttempt mapResultSetToQuizAttempt(ResultSet rs) throws SQLException {
        QuizAttempt attempt = new QuizAttempt();
        attempt.setId(rs.getLong("id"));
        attempt.setQuizId(rs.getLong("quiz_id"));
        attempt.setStudentId(rs.getLong("student_id"));
        attempt.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
        attempt.setEndTime(rs.getTimestamp("end_time") != null ? rs.getTimestamp("end_time").toLocalDateTime() : null);
        attempt.setScore(rs.getInt("score"));
        attempt.setMaxScore(rs.getInt("max_score"));
        attempt.setStatus(QuizAttempt.QuizAttemptStatus.valueOf(rs.getString("status")));
        return attempt;
    }
} 