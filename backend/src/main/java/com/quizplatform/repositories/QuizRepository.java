package com.quizplatform.repositories;

import com.quizplatform.Main;
import com.quizplatform.models.Quiz;
import com.quizplatform.models.Question;
import com.quizplatform.models.Answer;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class QuizRepository implements BaseRepository<Quiz> {
    private final QuestionRepository questionRepository;

    public QuizRepository() {
        this.questionRepository = new QuestionRepository();
    }

    @Override
    public Quiz create(Quiz quiz) {
        System.out.println("QuizRepository.create() - Starting quiz creation");
        System.out.println("Quiz data: " + quiz);
        System.out.println("Questions count: " + (quiz.getQuestions() != null ? quiz.getQuestions().size() : 0));

        String sql = "INSERT INTO quizzes (title, description, instructor_id, time_limit, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, quiz.getTitle());
            stmt.setString(2, quiz.getDescription());
            stmt.setLong(3, quiz.getInstructorId());
            stmt.setInt(4, quiz.getTimeLimit());
            stmt.setBoolean(5, quiz.getIsPublished());
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    quiz.setId(rs.getLong(1));
                    System.out.println("Created quiz with ID: " + quiz.getId());
                }
            }

            // Save questions and answers
            if (quiz.getQuestions() != null) {
                System.out.println("Saving " + quiz.getQuestions().size() + " questions");
                for (int i = 0; i < quiz.getQuestions().size(); i++) {
                    Question question = quiz.getQuestions().get(i);
                    System.out.println("Saving question " + (i + 1) + ": " + question.getQuestionText());
                    question.setQuizId(quiz.getId());
                    question.setOrder(i + 1);
                    Question savedQuestion = questionRepository.create(question);
                    System.out.println("Saved question with ID: " + savedQuestion.getId());
                    quiz.getQuestions().set(i, savedQuestion);
                }
            }

            // Fetch the complete quiz with questions
            String selectSql = "SELECT * FROM quizzes WHERE id = ?";
            try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
                selectStmt.setLong(1, quiz.getId());
                try (ResultSet rs = selectStmt.executeQuery()) {
                    if (rs.next()) {
                        Quiz createdQuiz = mapResultSetToQuiz(rs);
                        // Fetch questions with answers
                        System.out.println("Fetching questions for quiz ID: " + quiz.getId());
                        List<Question> questions = questionRepository.findByQuizId(quiz.getId(), true);
                        System.out.println("Found " + questions.size() + " questions");
                        createdQuiz.setQuestions(questions);
                        return createdQuiz;
                    }
                }
            }
            return quiz;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Error creating quiz: " + e.getMessage(), e);
        }
    }

    @Override
    public Optional<Quiz> findById(Long id) {
        String sql = "SELECT * FROM quizzes WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Quiz quiz = mapResultSetToQuiz(rs);
                    quiz.setQuestions(questionRepository.findByQuizId(quiz.getId(), false));
                    return Optional.of(quiz);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz", e);
        }
    }

    // Add a new method for instructors to view quiz with correct answers
    public Optional<Quiz> findByIdWithAnswers(Long id) {
        String sql = "SELECT * FROM quizzes WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Quiz quiz = mapResultSetToQuiz(rs);
                    // Get questions with correct answers for instructors
                    quiz.setQuestions(questionRepository.findByQuizId(quiz.getId(), true));
                    return Optional.of(quiz);
                }
            }
            return Optional.empty();
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quiz", e);
        }
    }

    public List<Quiz> findByInstructorId(Long instructorId) {
        String sql = "SELECT * FROM quizzes WHERE instructor_id = ?";
        List<Quiz> quizzes = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, instructorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Quiz quiz = mapResultSetToQuiz(rs);
                    try {
                        quiz.setQuestions(questionRepository.findByQuizId(quiz.getId(), true));
                    } catch (Exception e) {
                        quiz.setQuestions(new ArrayList<>());
                    }
                    quizzes.add(quiz);
                }
            }
            return quizzes;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding quizzes by instructor", e);
        }
    }

    public List<Quiz> findPublishedQuizzes() {
        String sql = "SELECT * FROM quizzes WHERE is_published = true";
        List<Quiz> quizzes = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Quiz quiz = mapResultSetToQuiz(rs);
                quiz.setQuestions(questionRepository.findByQuizId(quiz.getId(), false));
                quizzes.add(quiz);
            }
            return quizzes;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding published quizzes", e);
        }
    }

    // Implementation for student: return all published quizzes for now
    public List<Quiz> findAvailableForStudent(Long studentId) {
        return findPublishedQuizzes();
    }

    @Override
    public List<Quiz> findAll() {
        String sql = "SELECT * FROM quizzes";
        List<Quiz> quizzes = new ArrayList<>();
        try (Connection connection = Main.getDataSource().getConnection();
             Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Quiz quiz = mapResultSetToQuiz(rs);
                quiz.setQuestions(questionRepository.findByQuizId(quiz.getId(), false));
                quizzes.add(quiz);
            }
            return quizzes;
        } catch (SQLException e) {
            throw new RuntimeException("Error finding all quizzes", e);
        }
    }

    @Override
    public Quiz update(Quiz quiz) {
        String sql = "UPDATE quizzes SET title = ?, description = ?, time_limit = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, quiz.getTitle());
            stmt.setString(2, quiz.getDescription());
            stmt.setInt(3, quiz.getTimeLimit());
            stmt.setBoolean(4, quiz.getIsPublished());
            stmt.setLong(5, quiz.getId());
            
            stmt.executeUpdate();
            return quiz;
        } catch (SQLException e) {
            throw new RuntimeException("Error updating quiz", e);
        }
    }

    @Override
    public void delete(Long id) {
        try (Connection connection = Main.getDataSource().getConnection()) {
            // Delete all submission answers for this quiz's submissions
            String deleteSubmissionAnswers = "DELETE FROM submission_answers WHERE submission_id IN (SELECT id FROM quiz_submissions WHERE quiz_id = ?)";
            try (PreparedStatement stmt = connection.prepareStatement(deleteSubmissionAnswers)) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
            
            // Delete all submissions for this quiz
            String deleteSubmissions = "DELETE FROM quiz_submissions WHERE quiz_id = ?";
            try (PreparedStatement stmt = connection.prepareStatement(deleteSubmissions)) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
            
            // Delete all answers for this quiz's questions
            String deleteAnswers = "DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ?)";
            try (PreparedStatement stmt = connection.prepareStatement(deleteAnswers)) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
            
            // Delete all questions for this quiz
            String deleteQuestions = "DELETE FROM questions WHERE quiz_id = ?";
            try (PreparedStatement stmt = connection.prepareStatement(deleteQuestions)) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
            
            // Finally, delete the quiz
            String deleteQuiz = "DELETE FROM quizzes WHERE id = ?";
            try (PreparedStatement stmt = connection.prepareStatement(deleteQuiz)) {
                stmt.setLong(1, id);
                stmt.executeUpdate();
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error deleting quiz", e);
        }
    }

    private Quiz mapResultSetToQuiz(ResultSet rs) throws SQLException {
        try {
            Quiz quiz = new Quiz();
            quiz.setId(rs.getLong("id"));
            quiz.setTitle(rs.getString("title"));
            quiz.setDescription(rs.getString("description"));
            quiz.setInstructorId(rs.getLong("instructor_id"));
            quiz.setTimeLimit(rs.getInt("time_limit"));
            quiz.setIsPublished(rs.getBoolean("is_published"));
            quiz.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            quiz.setUpdatedAt(rs.getTimestamp("updated_at").toLocalDateTime());
            quiz.setQuestions(new ArrayList<>()); // Initialize with empty list
            return quiz;
        } catch (Exception e) {
            e.printStackTrace();
            throw new SQLException("Error mapping quiz from result set: " + e.getMessage(), e);
        }
    }

    public Question addQuestion(Question question) {
        String sql = "INSERT INTO questions (quiz_id, question_text, question_type, points, question_order) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = Main.getDataSource().getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, question.getQuizId());
            stmt.setString(2, question.getQuestionText());
            stmt.setString(3, question.getType().name());
            stmt.setInt(4, question.getPoints());
            stmt.setInt(5, question.getOrder() != null ? question.getOrder() : 1); // Default to 1 if not provided
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    question.setId(rs.getLong(1));
                }
            }

            // Add answers if provided
            if (question.getAnswers() != null && !question.getAnswers().isEmpty()) {
                String answerSql = "INSERT INTO answers (question_id, answer_text, is_correct, answer_order) VALUES (?, ?, ?, ?)";
                try (PreparedStatement answerStmt = conn.prepareStatement(answerSql, Statement.RETURN_GENERATED_KEYS)) {
                    for (int i = 0; i < question.getAnswers().size(); i++) {
                        Answer answer = question.getAnswers().get(i);
                        answer.setQuestionId(question.getId()); // Set the question ID
                        answerStmt.setLong(1, question.getId());
                        answerStmt.setString(2, answer.getAnswerText());
                        answerStmt.setBoolean(3, answer.getIsCorrect());
                        answerStmt.setInt(4, answer.getAnswerOrder() != null ? answer.getAnswerOrder() : i + 1); // Default to position in list if not provided
                        answerStmt.executeUpdate();

                        try (ResultSet answerRs = answerStmt.getGeneratedKeys()) {
                            if (answerRs.next()) {
                                answer.setId(answerRs.getLong(1));
                            }
                        }
                    }
                }
            }

            // Fetch the complete question with answers
            String selectSql = "SELECT q.*, a.id as answer_id, a.answer_text, a.is_correct, a.answer_order " +
                             "FROM questions q " +
                             "LEFT JOIN answers a ON q.id = a.question_id " +
                             "WHERE q.id = ?";
            try (PreparedStatement selectStmt = conn.prepareStatement(selectSql)) {
                selectStmt.setLong(1, question.getId());
                try (ResultSet rs = selectStmt.executeQuery()) {
                    if (rs.next()) {
                        question.setId(rs.getLong("id"));
                        question.setQuizId(rs.getLong("quiz_id"));
                        question.setQuestionText(rs.getString("question_text"));
                        question.setType(Question.QuestionType.valueOf(rs.getString("question_type")));
                        question.setPoints(rs.getInt("points"));
                        question.setOrder(rs.getInt("question_order"));
                        
                        List<Answer> answers = new ArrayList<>();
                        do {
                            if (rs.getLong("answer_id") != 0) {
                                Answer answer = new Answer();
                                answer.setId(rs.getLong("answer_id"));
                                answer.setQuestionId(question.getId());
                                answer.setAnswerText(rs.getString("answer_text"));
                                answer.setIsCorrect(rs.getBoolean("is_correct"));
                                answer.setAnswerOrder(rs.getInt("answer_order"));
                                answers.add(answer);
                            }
                        } while (rs.next());
                        question.setAnswers(answers);
                    }
                }
            }

            return question;
        } catch (SQLException e) {
            e.printStackTrace();
            throw new RuntimeException("Error adding question: " + e.getMessage(), e);
        }
    }

    public boolean hasSubmissions(Long quizId) {
        String sql = "SELECT COUNT(*) FROM quiz_submissions WHERE quiz_id = ?";
        try (Connection connection = Main.getDataSource().getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, quizId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
            return false;
        } catch (SQLException e) {
            throw new RuntimeException("Error checking quiz submissions", e);
        }
    }
}