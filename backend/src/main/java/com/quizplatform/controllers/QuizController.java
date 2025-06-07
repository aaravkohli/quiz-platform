package com.quizplatform.controllers;

import com.quizplatform.models.Quiz;
import com.quizplatform.models.Question;
import com.quizplatform.models.User;
import com.quizplatform.models.QuizSubmission;
import com.quizplatform.repositories.QuizRepository;
import com.quizplatform.repositories.QuizSubmissionRepository;
import io.javalin.http.Context;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

public class QuizController extends BaseController {
    private final QuizRepository quizRepository;
    private final QuizSubmissionRepository submissionRepository;

    public QuizController() {
        this.quizRepository = new QuizRepository();
        this.submissionRepository = new QuizSubmissionRepository();
    }

    protected Long getCurrentUserId(Context ctx) {
        return (Long) ctx.attribute("userId");
    }

    public void createQuiz(Context ctx) {
        try {
            // Only instructors can create quizzes
            User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
            if (userRole != User.UserRole.INSTRUCTOR) {
                errorResponse(ctx, 403, "Instructor access required");
                return;
            }

            Quiz quiz = parseBody(ctx, Quiz.class);
            quiz.setInstructorId(getCurrentUserId(ctx));
            quiz.setIsPublished(false);
            
            // Set default time limit if not provided
            if (quiz.getTimeLimit() == null) {
                quiz.setTimeLimit(30); // Default 30 minutes
            }
            
            Quiz createdQuiz = quizRepository.create(quiz);
            jsonResponse(ctx, createdQuiz);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error creating quiz: " + e.getMessage());
        }
    }

    public void getQuizzes(Context ctx) {
        try {
            User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
            List<Quiz> quizzes;
            
            if (userRole == User.UserRole.INSTRUCTOR) {
                quizzes = quizRepository.findByInstructorId(getCurrentUserId(ctx));
            } else {
                quizzes = quizRepository.findPublishedQuizzes();
            }
            
            jsonResponse(ctx, quizzes);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error fetching quizzes: " + e.getMessage());
        }
    }

    public void getQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Long userId = getCurrentUserId(ctx);
            Object userRoleObj = ctx.attribute("userRole");
            User.UserRole role = userRoleObj != null ? User.UserRole.valueOf(userRoleObj.toString()) : null;
            
            System.out.println("=== Quiz Debug ===");
            System.out.println("Request path: " + ctx.path());
            System.out.println("Quiz ID: " + quizId);
            System.out.println("User ID: " + userId);
            System.out.println("User Role: " + role);
            
            Optional<Quiz> quiz;
            if (role == User.UserRole.INSTRUCTOR) {
                quiz = quizRepository.findByIdWithAnswers(quizId);
            } else {
                quiz = quizRepository.findById(quizId);
            }
            
            if (quiz.isPresent()) {
                if (role == User.UserRole.INSTRUCTOR && !quiz.get().getInstructorId().equals(userId)) {
                    ctx.status(403).json(Map.of("error", "You don't have permission to view this quiz"));
                    return;
                }
                ctx.json(quiz.get());
            } else {
                ctx.status(404).json(Map.of("error", "Quiz not found"));
            }
        } catch (Exception e) {
            ctx.status(500).json(Map.of("error", "Error retrieving quiz: " + e.getMessage()));
        }
    }

    public void updateQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Quiz existingQuiz = quizRepository.findById(quizId).orElse(null);
            
            if (existingQuiz == null) {
                errorResponse(ctx, 404, "Quiz not found");
                return;
            }
            
            if (!existingQuiz.getInstructorId().equals(getCurrentUserId(ctx))) {
                errorResponse(ctx, 403, "You don't have permission to modify this quiz");
                return;
            }
            
            Quiz updatedQuiz = parseBody(ctx, Quiz.class);
            updatedQuiz.setId(quizId);
            updatedQuiz.setInstructorId(existingQuiz.getInstructorId());
            
            Quiz savedQuiz = quizRepository.update(updatedQuiz);
            jsonResponse(ctx, savedQuiz);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error updating quiz: " + e.getMessage());
        }
    }

    public void deleteQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            if (quiz == null) {
                errorResponse(ctx, 404, "Quiz not found");
                return;
            }
            if (!quiz.getInstructorId().equals(getCurrentUserId(ctx))) {
                errorResponse(ctx, 403, "You don't have permission to delete this quiz");
                return;
            }
            boolean force = Boolean.parseBoolean(ctx.queryParam("force") != null ? ctx.queryParam("force") : "false");
            if (quizRepository.hasSubmissions(quizId) && !force) {
                ctx.status(409).json(Map.of("hasSubmissions", true, "message", "This quiz has submissions. Confirm deletion to proceed."));
                return;
            }
            quizRepository.delete(quizId);
            ctx.status(204);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error deleting quiz: " + e.getMessage());
        }
    }

    public void addQuestion(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Question question = parseBody(ctx, Question.class);
            
            // Verify quiz ownership
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            if (quiz == null) {
                errorResponse(ctx, 404, "Quiz not found");
                return;
            }
            if (!quiz.getInstructorId().equals(getCurrentUserId(ctx))) {
                errorResponse(ctx, 403, "You don't have permission to modify this quiz");
                return;
            }
            
            question.setQuizId(quizId);
            Question createdQuestion = quizRepository.addQuestion(question);
            jsonResponse(ctx, createdQuestion);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error adding question: " + e.getMessage());
        }
    }

    public void publishQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            
            if (quiz == null) {
                errorResponse(ctx, 404, "Quiz not found");
                return;
            }
            
            if (!quiz.getInstructorId().equals(getCurrentUserId(ctx))) {
                errorResponse(ctx, 403, "You don't have permission to publish this quiz");
                return;
            }
            
            quiz.setIsPublished(true);
            Quiz updatedQuiz = quizRepository.update(quiz);
            jsonResponse(ctx, updatedQuiz);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error publishing quiz: " + e.getMessage());
        }
    }

    public void startQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Long studentId = getCurrentUserId(ctx);
            
            System.out.println("Starting quiz " + quizId + " for student " + studentId);
            
            // Verify quiz exists and is published
            Optional<Quiz> quiz = quizRepository.findById(quizId);
            if (!quiz.isPresent()) {
                System.out.println("Quiz " + quizId + " not found");
                ctx.status(404).json(Map.of("error", "Quiz not found"));
                return;
            }
            if (!quiz.get().getIsPublished()) {
                System.out.println("Quiz " + quizId + " is not published");
                ctx.status(403).json(Map.of("error", "Quiz is not published"));
                return;
            }

            System.out.println("Creating submission for quiz " + quizId);
            // Create new submission
            QuizSubmission submission = new QuizSubmission();
            submission.setQuizId(quizId);
            submission.setStudentId(studentId);
            submission.setScore(0);
            submission.setStartedAt(LocalDateTime.now());
            submission.setCompletedAt(null);
            submission.setSubmittedAt(null);
            submission.setAnswers(new HashMap<>());

            QuizSubmission createdSubmission = submissionRepository.create(submission);
            System.out.println("Created submission with ID: " + createdSubmission.getId());
            ctx.json(createdSubmission);
        } catch (Exception e) {
            e.printStackTrace(); // Add stack trace
            ctx.status(500).json(Map.of("error", "Error starting quiz: " + e.getMessage()));
        }
    }

    public void submitQuiz(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Long studentId = getCurrentUserId(ctx);
            
            // Get the submission
            List<QuizSubmission> submissions = submissionRepository.findByStudentId(studentId);
            QuizSubmission submission = submissions.stream()
                .filter(s -> s.getQuizId().equals(quizId) && s.getCompletedAt() == null)
                .findFirst()
                .orElse(null);

            if (submission == null) {
                ctx.status(404).json(Map.of("error", "No active submission found for this quiz"));
                return;
            }

            // Get the quiz to calculate score
            Optional<Quiz> quiz = quizRepository.findByIdWithAnswers(quizId);
            if (!quiz.isPresent()) {
                ctx.status(404).json(Map.of("error", "Quiz not found"));
                return;
            }

            // Parse submitted answers
            Map<String, Object> body = ctx.bodyAsClass(Map.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> submittedAnswers = (Map<String, Object>) body.get("answers");
            
            // Convert string keys to Long and Integer values to Long
            Map<Long, Long> answers = new HashMap<>();
            for (Map.Entry<String, Object> entry : submittedAnswers.entrySet()) {
                Long questionId = Long.parseLong(entry.getKey());
                Long answerId = ((Number) entry.getValue()).longValue();
                answers.put(questionId, answerId);
            }
            submission.setAnswers(answers);

            // Calculate score
            int totalScore = 0;
            for (Question question : quiz.get().getQuestions()) {
                Long selectedAnswerId = answers.get(question.getId());
                if (selectedAnswerId != null) {
                    boolean isCorrect = question.getAnswers().stream()
                        .anyMatch(a -> a.getId().equals(selectedAnswerId) && a.getIsCorrect());
                    if (isCorrect) {
                        totalScore += question.getPoints();
                    }
                }
            }
            submission.setScore(totalScore);
            submission.setCompletedAt(LocalDateTime.now());
            submission.setSubmittedAt(LocalDateTime.now());

            // Update submission
            QuizSubmission updatedSubmission = submissionRepository.update(submission);
            ctx.json(updatedSubmission);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json(Map.of("error", "Error submitting quiz: " + e.getMessage()));
        }
    }

    public void getSubmission(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Long studentId = getCurrentUserId(ctx);
            
            List<QuizSubmission> submissions = submissionRepository.findByStudentId(studentId);
            QuizSubmission submission = submissions.stream()
                .filter(s -> s.getQuizId().equals(quizId))
                .findFirst()
                .orElse(null);

            if (submission == null) {
                ctx.status(404).json(Map.of("error", "No submission found for this quiz"));
                return;
            }

            ctx.json(submission);
        } catch (Exception e) {
            ctx.status(500).json(Map.of("error", "Error getting submission: " + e.getMessage()));
        }
    }

    public void getSubmissionById(Context ctx) {
        try {
            Long submissionId = Long.parseLong(ctx.pathParam("id"));
            QuizSubmission submission = submissionRepository.findById(submissionId).orElse(null);
            if (submission == null) {
                ctx.status(404).json(Map.of("error", "Submission not found"));
                return;
            }
            ctx.json(submission);
        } catch (Exception e) {
            ctx.status(500).json(Map.of("error", "Error getting submission: " + e.getMessage()));
        }
    }

    public void getQuizAttempts(Context ctx) {
        try {
            Long quizId = Long.parseLong(ctx.pathParam("id"));
            Long instructorId = getCurrentUserId(ctx);
            User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
            
            System.out.println("=== Quiz Attempts Debug ===");
            System.out.println("Request path: " + ctx.path());
            System.out.println("Quiz ID: " + quizId);
            System.out.println("Instructor ID: " + instructorId);
            System.out.println("User Role: " + userRole);
            System.out.println("Auth Header: " + ctx.header("Authorization"));
            
            // Verify quiz ownership
            Quiz quiz = quizRepository.findById(quizId).orElse(null);
            if (quiz == null) {
                System.out.println("Quiz " + quizId + " not found");
                errorResponse(ctx, 404, "Quiz not found");
                return;
            }
            
            System.out.println("Found quiz: " + quiz.getTitle() + " (instructor: " + quiz.getInstructorId() + ")");
            System.out.println("Current instructor ID: " + instructorId);
            System.out.println("Quiz instructor ID: " + quiz.getInstructorId());
            System.out.println("IDs match: " + quiz.getInstructorId().equals(instructorId));
            
            if (!quiz.getInstructorId().equals(instructorId)) {
                System.out.println("Permission denied: instructor " + instructorId + " does not own quiz " + quizId);
                errorResponse(ctx, 403, "You don't have permission to view attempts for this quiz");
                return;
            }
            
            List<QuizSubmission> submissions = submissionRepository.findByQuizId(quizId);
            System.out.println("Found " + submissions.size() + " submissions for quiz " + quizId);
            jsonResponse(ctx, submissions);
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error getting quiz attempts: " + e.getMessage());
        }
    }
} 