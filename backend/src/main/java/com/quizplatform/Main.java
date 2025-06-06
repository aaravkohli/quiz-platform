package com.quizplatform;

import com.quizplatform.controllers.UserController;
import com.quizplatform.controllers.QuizController;
import com.quizplatform.middleware.AuthMiddleware;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;
import io.javalin.plugin.bundled.CorsPluginConfig;
import com.quizplatform.models.User;
import io.javalin.security.RouteRole;
import io.javalin.security.AccessManager;
import io.javalin.http.Context;
import io.javalin.http.Handler;
import java.util.Set;
import org.flywaydb.core.Flyway;

public class Main {
    private static HikariDataSource dataSource;

    public static void main(String[] args) {
        // Initialize database connection
        initializeDatabase();

        // Run database migrations
        runMigrations();

        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.plugins.enableCors(cors -> {
                cors.add(it -> {
                    it.allowHost("http://localhost:3000");
                    it.allowCredentials = true;
                });
            });
            config.accessManager((handler, ctx, permittedRoles) -> {
                // Get user role from context
                User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
                
                // If no roles are required, allow access
                if (permittedRoles.isEmpty()) {
                    handler.handle(ctx);
                    return;
                }
                
                // If user has no role but roles are required, deny access
                if (userRole == null) {
                    ctx.status(401).result("Unauthorized");
                    return;
                }
                
                // Check if user's role is in the permitted roles
                if (permittedRoles.contains(userRole)) {
                    handler.handle(ctx);
                } else {
                    ctx.status(403).result("Forbidden");
                }
            });
        });

        // Initialize controllers
        UserController userController = new UserController();
        QuizController quizController = new QuizController();

        // Public routes
        app.post("/api/users/register", userController::register);
        app.post("/api/users/login", userController::login);
        app.get("/health", ctx -> ctx.result("OK"));
        app.get("/api/", ctx -> ctx.result("Quiz Platform API Root"));

        // Protected routes - require authentication
        app.before("/api/*", ctx -> {
            // Skip auth for public routes
            if (ctx.path().equals("/api/users/register") || ctx.path().equals("/api/users/login")) {
                return;
            }
            AuthMiddleware.requireAuth.handle(ctx);
        });

        // User routes
        app.get("/api/users/me", ctx -> {
            Long userId = (Long) ctx.attribute("userId");
            if (userId == null) {
                ctx.status(401).result("Unauthorized");
                return;
            }
            userController.getProfile(ctx);
        });
        app.get("/api/users/{id}", userController::getProfile);
        app.put("/api/users/{id}", userController::updateProfile);
        
        // Instructor-only routes
        app.before("/api/users", AuthMiddleware.requireInstructor);
        app.get("/api/users", userController::getAllUsers);
        app.delete("/api/users/{id}", userController::deleteUser);

        // Quiz routes
        app.post("/api/quizzes", quizController::createQuiz, User.UserRole.INSTRUCTOR);
        app.get("/api/quizzes", quizController::getQuizzes);
        app.get("/api/quizzes/{id}", quizController::getQuiz);
        app.put("/api/quizzes/{id}", quizController::updateQuiz, User.UserRole.INSTRUCTOR);
        app.delete("/api/quizzes/{id}", quizController::deleteQuiz, User.UserRole.INSTRUCTOR);
        app.post("/api/quizzes/{id}/questions", quizController::addQuestion, User.UserRole.INSTRUCTOR);
        app.post("/api/quizzes/{id}/publish", quizController::publishQuiz, User.UserRole.INSTRUCTOR);

        // Quiz submission routes
        app.post("/api/quizzes/{id}/start", quizController::startQuiz, User.UserRole.STUDENT);
        app.post("/api/quizzes/{id}/submit", quizController::submitQuiz, User.UserRole.STUDENT);
        app.get("/api/quizzes/{id}/submission", quizController::getSubmission, User.UserRole.STUDENT);
        app.get("/api/submissions/{id}", quizController::getSubmissionById);

        // Start the server
        app.start(7000);
    }

    private static void initializeDatabase() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost:5432/quiz_platform");
        config.setUsername("postgres");
        config.setPassword("postgres");
        config.setMaximumPoolSize(10);
        dataSource = new HikariDataSource(config);
    }

    private static void runMigrations() {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .load();
        flyway.migrate();
    }

    public static HikariDataSource getDataSource() {
        return dataSource;
    }
} 