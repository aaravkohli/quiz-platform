package com.quizplatform.repositories;

import com.quizplatform.Main;
import com.quizplatform.models.QuizSubmission;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class QuizSubmissionRepository implements BaseRepository<QuizSubmission> {
    @Override
    public QuizSubmission create(QuizSubmission submission) {
        String sql = "INSERT INTO quiz_submissions (quiz_id, student_id, score, started_at, completed_at, submitted_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, submission.getQuizId());
            stmt.setLong(2, submission.getStudentId());
            stmt.setInt(3, submission.getScore());
            stmt.setTimestamp(4, Timestamp.valueOf(submission.getStartedAt()));
            stmt.setTimestamp(5, submission.getCompletedAt() != null ? Timestamp.valueOf(submission.getCompletedAt()) : null);
            stmt.setTimestamp(6, submission.getSubmittedAt() != null ? Timestamp.valueOf(submission.getSubmittedAt()) : null);
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    submission.setId(rs.getLong(1));
                }
            }

            // Save answers
            if (submission.getAnswers() != null && !submission.getAnswers().isEmpty()) {
                String answerSql = "INSERT INTO submission_answers (submission_id, question_id, selected_answer_id) VALUES (?, ?, ?)";
                try (PreparedStatement answerStmt = conn.prepareStatement(answerSql)) {
                    for (Map.Entry<Long, Long> entry : submission.getAnswers().entrySet()) {
                        answerStmt.setLong(1, submission.getId());
                        answerStmt.setLong(2, entry.getKey());
                        answerStmt.setLong(3, entry.getValue());
                        answerStmt.executeUpdate();
                    }
                }
            }

            return submission;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Error creating quiz submission: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<QuizSubmission> findById(Long id) {
        String sql = "SELECT * FROM quiz_submissions WHERE id = ?";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    QuizSubmission submission = mapResultSetToSubmission(rs);
                    submission.setAnswers(getSubmissionAnswers(submission.getId()));
                    return Optional.of(submission);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz submission", e);
        }
    }

    public List<QuizSubmission> findByStudentId(Long studentId) {
        String sql = "SELECT * FROM quiz_submissions WHERE student_id = ? ORDER BY submitted_at DESC";
        List<QuizSubmission> submissions = new ArrayList<>();
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    QuizSubmission submission = mapResultSetToSubmission(rs);
                    submission.setAnswers(getSubmissionAnswers(submission.getId()));
                    submissions.add(submission);
                }
            }
            return submissions;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz submissions by student", e);
        }
    }

    public List<QuizSubmission> findByQuizId(Long quizId) {
        String sql = "SELECT * FROM quiz_submissions WHERE quiz_id = ? ORDER BY submitted_at DESC";
        List<QuizSubmission> submissions = new ArrayList<>();
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    QuizSubmission submission = mapResultSetToSubmission(rs);
                    submission.setAnswers(getSubmissionAnswers(submission.getId()));
                    submissions.add(submission);
                }
            }
            return submissions;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz submissions by quiz", e);
        }
    }

    @Override
    public List<QuizSubmission> findAll() {
        String sql = "SELECT * FROM quiz_submissions ORDER BY submitted_at DESC";
        List<QuizSubmission> submissions = new ArrayList<>();
        try (Connection conn = Main.getDataSource().getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                QuizSubmission submission = mapResultSetToSubmission(rs);
                submission.setAnswers(getSubmissionAnswers(submission.getId()));
                submissions.add(submission);
            }
            return submissions;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding all quiz submissions", e);
        }
    }

    @Override
    public QuizSubmission update(QuizSubmission submission) {
        String sql = "UPDATE quiz_submissions SET score = ?, completed_at = ?, submitted_at = ? WHERE id = ?";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, submission.getScore());
            stmt.setTimestamp(2, submission.getCompletedAt() != null ? Timestamp.valueOf(submission.getCompletedAt()) : null);
            stmt.setTimestamp(3, submission.getSubmittedAt() != null ? Timestamp.valueOf(submission.getSubmittedAt()) : null);
            stmt.setLong(4, submission.getId());
            stmt.executeUpdate();

            // Update answers
            if (submission.getAnswers() != null && !submission.getAnswers().isEmpty()) {
                // Delete existing answers
                String deleteSql = "DELETE FROM submission_answers WHERE submission_id = ?";
                try (PreparedStatement deleteStmt = conn.prepareStatement(deleteSql)) {
                    deleteStmt.setLong(1, submission.getId());
                    deleteStmt.executeUpdate();
                }

                // Insert new answers
                String answerSql = "INSERT INTO submission_answers (submission_id, question_id, selected_answer_id) VALUES (?, ?, ?)";
                try (PreparedStatement answerStmt = conn.prepareStatement(answerSql)) {
                    for (Map.Entry<Long, Long> entry : submission.getAnswers().entrySet()) {
                        answerStmt.setLong(1, submission.getId());
                        answerStmt.setLong(2, entry.getKey());
                        answerStmt.setLong(3, entry.getValue());
                        answerStmt.executeUpdate();
                    }
                }
            }

            return submission;
        } catch (SQLException e) {
            throw new RuntimeException("Error updating quiz submission", e);
        }
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM quiz_submissions WHERE id = ?";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting quiz submission", e);
        }
    }

    private QuizSubmission mapResultSetToSubmission(ResultSet rs) throws SQLException {
        QuizSubmission submission = new QuizSubmission();
        submission.setId(rs.getLong("id"));
        submission.setQuizId(rs.getLong("quiz_id"));
        submission.setStudentId(rs.getLong("student_id"));
        submission.setScore(rs.getInt("score"));
        submission.setStartedAt(rs.getTimestamp("started_at").toLocalDateTime());
        
        Timestamp completedAt = rs.getTimestamp("completed_at");
        submission.setCompletedAt(completedAt != null ? completedAt.toLocalDateTime() : null);
        
        Timestamp submittedAt = rs.getTimestamp("submitted_at");
        submission.setSubmittedAt(submittedAt != null ? submittedAt.toLocalDateTime() : null);
        
        return submission;
    }

    private Map<Long, Long> getSubmissionAnswers(Long submissionId) {
        String sql = "SELECT question_id, selected_answer_id FROM submission_answers WHERE submission_id = ?";
        Map<Long, Long> answers = new HashMap<>();
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, submissionId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    answers.put(rs.getLong("question_id"), rs.getLong("selected_answer_id"));
                }
            }
            return answers;
        } catch (SQLException e) {
            throw new RuntimeException("Error getting submission answers", e);
        }
    }
} 