package com.quizplatform.repositories;

import com.quizplatform.Main;
import com.quizplatform.models.Answer;
import com.quizplatform.models.Question;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class QuestionRepository implements BaseRepository<Question> {
    private final AnswerRepository answerRepository;

    public QuestionRepository() {
        this.answerRepository = new AnswerRepository();
    }

    @Override
    public Question create(Question question) {
        String sql = "INSERT INTO questions (quiz_id, question_text, type, points, question_order) VALUES (?, ?, ?, ?, ?)";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, question.getQuizId());
            stmt.setString(2, question.getQuestionText());
            stmt.setString(3, question.getType().name());
            stmt.setInt(4, question.getPoints());
            stmt.setInt(5, question.getOrder());
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    question.setId(rs.getLong(1));
                }
            }
            return question;
        } catch (SQLException e) {
            throw new RuntimeException("Error creating question", e);
        }
    }

    @Override
    public Optional<Question> findById(Long id) {
        String sql = "SELECT * FROM questions WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Question question = mapResultSetToQuestion(rs);
                    question.setAnswers(answerRepository.findByQuestionId(question.getId()));
                    return Optional.of(question);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding question", e);
        }
    }

    public List<Question> findByQuizId(Long quizId, boolean includeCorrectAnswers) {
        String sql = "SELECT q.*, a.id as answer_id, a.answer_text, a.is_correct, a.answer_order " +
                    "FROM questions q " +
                    "LEFT JOIN answers a ON q.id = a.question_id " +
                    "WHERE q.quiz_id = ? " +
                    "ORDER BY q.question_order, a.answer_order";
        List<Question> questions = new ArrayList<>();
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                Question currentQuestion = null;
                while (rs.next()) {
                    long questionId = rs.getLong("id");
                    if (currentQuestion == null || currentQuestion.getId() != questionId) {
                        if (currentQuestion != null) {
                            questions.add(currentQuestion);
                        }
                        currentQuestion = new Question();
                        currentQuestion.setId(questionId);
                        currentQuestion.setQuizId(quizId);
                        currentQuestion.setQuestionText(rs.getString("question_text"));
                        currentQuestion.setType(Question.QuestionType.valueOf(rs.getString("type")));
                        currentQuestion.setPoints(rs.getInt("points"));
                        currentQuestion.setOrder(rs.getInt("question_order"));
                        currentQuestion.setAnswers(new ArrayList<>());
                    }
                    
                    if (rs.getLong("answer_id") != 0) {
                        Answer answer = new Answer();
                        answer.setId(rs.getLong("answer_id"));
                        answer.setQuestionId(questionId);
                        answer.setAnswerText(rs.getString("answer_text"));
                        if (includeCorrectAnswers) {
                            answer.setIsCorrect(rs.getBoolean("is_correct"));
                        }
                        answer.setOrder(rs.getInt("answer_order"));
                        currentQuestion.getAnswers().add(answer);
                    }
                }
                if (currentQuestion != null) {
                    questions.add(currentQuestion);
                }
            }
            return questions;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding questions by quiz ID", e);
        }
    }

    @Override
    public List<Question> findAll() {
        String sql = "SELECT * FROM questions ORDER BY question_order";
        List<Question> questions = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Question question = mapResultSetToQuestion(rs);
                question.setAnswers(answerRepository.findByQuestionId(question.getId()));
                questions.add(question);
            }
            return questions;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding all questions", e);
        }
    }

    @Override
    public Question update(Question question) {
        String sql = "UPDATE questions SET question_text = ?, type = ?, points = ?, question_order = ? WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, question.getQuestionText());
            stmt.setString(2, question.getType().name());
            stmt.setInt(3, question.getPoints());
            stmt.setInt(4, question.getOrder());
            stmt.setLong(5, question.getId());
            
            stmt.executeUpdate();
            return question;
        } catch (SQLException e) {
            throw new RuntimeException("Error updating question", e);
        }
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM questions WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting question", e);
        }
    }

    private Question mapResultSetToQuestion(ResultSet rs) throws SQLException {
        Question question = new Question();
        question.setId(rs.getLong("id"));
        question.setQuizId(rs.getLong("quiz_id"));
        question.setQuestionText(rs.getString("question_text"));
        question.setType(Question.QuestionType.valueOf(rs.getString("type")));
        question.setPoints(rs.getInt("points"));
        question.setOrder(rs.getInt("question_order"));
        return question;
    }
} 