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
import java.util.Map;
import com.quizplatform.utils.SecurityUtils;

public class Main {
    private static HikariDataSource dataSource;

    public static void main(String[] args) {
        initializeDatabase();
        runMigrations();

        Javalin app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.plugins.enableCors(cors -> {
                cors.add(it -> {
                    it.allowHost("http://localhost:3000");
                    it.allowHost("http://localhost");
                    it.allowHost("https://*.vercel.app");
                    it.allowCredentials = true;
                });
            });
            config.requestLogger.http((ctx, ms) -> {
                System.out.println("Request: " + ctx.method() + " " + ctx.path() + " - " + ms + "ms");
            });
            config.accessManager((handler, ctx, permittedRoles) -> {
                User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
                
                if (permittedRoles.isEmpty()) {
                    handler.handle(ctx);
                    return;
                }
                
                if (userRole == null) {
                    ctx.status(401).result("Unauthorized");
                    return;
                }

                if (permittedRoles.contains(userRole)) {
                    handler.handle(ctx);
                } else {
                    ctx.status(403).result("Forbidden");
                }
            });
        });


        UserController userController = new UserController();
        QuizController quizController = new QuizController();


        app.get("/", ctx -> {
            System.out.println("Root endpoint hit!");
            ctx.result("Server is running!");
        });
        app.post("/api/users/register", userController::register);
        app.post("/api/users/login", userController::login);
        app.get("/health", ctx -> ctx.result("OK"));
        app.get("/api/", ctx -> ctx.result("Quiz Platform API Root"));


        app.before("/api/*", ctx -> {
            System.out.println("AuthMiddleware running for: " + ctx.path());
            if (ctx.path().equals("/api/users/register") || ctx.path().equals("/api/users/login")) {
                return;
            }
            AuthMiddleware.requireAuth.handle(ctx);
        });

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
        
        app.before("/api/users", AuthMiddleware.requireInstructor);
        app.get("/api/users", userController::getAllUsers);
        app.delete("/api/users/{id}", userController::deleteUser);

        app.post("/api/quizzes", quizController::createQuiz, User.UserRole.INSTRUCTOR);
        app.get("/api/quizzes", quizController::getQuizzes);
        app.get("/api/quizzes/{id}", quizController::getQuiz);
        app.put("/api/quizzes/{id}", quizController::updateQuiz, User.UserRole.INSTRUCTOR);
        app.delete("/api/quizzes/{id}", quizController::deleteQuiz, User.UserRole.INSTRUCTOR);
        app.post("/api/quizzes/{id}/questions", quizController::addQuestion, User.UserRole.INSTRUCTOR);
        app.post("/api/quizzes/{id}/publish", quizController::publishQuiz, User.UserRole.INSTRUCTOR);

        app.get("/api/test", ctx -> {
            System.out.println("Test route hit!");
            ctx.result("Test route works!");
        });

        app.get("/api/quizzes/{id}/attempts", ctx -> {
            System.out.println("=== Quiz Attempts Route ===");
            System.out.println("Request path: " + ctx.path());
            System.out.println("Quiz ID: " + ctx.pathParam("id"));
            System.out.println("Auth header: " + ctx.header("Authorization"));
            try {
                String token = ctx.header("Authorization");
                if (token == null || !token.startsWith("Bearer ")) {
                    ctx.status(401).json(Map.of("error", "Authentication required"));
                    return;
                }
                token = token.substring(7);
                SecurityUtils.verifyToken(token);
                Long userId = SecurityUtils.getUserIdFromToken(token);
                User.UserRole role = SecurityUtils.getRoleFromToken(token);
                System.out.println("User ID: " + userId);
                System.out.println("User Role: " + role);
                if (role != User.UserRole.INSTRUCTOR) {
                    ctx.status(403).json(Map.of("error", "Instructor access required"));
                    return;
                }
                ctx.attribute("userId", userId);
                ctx.attribute("userRole", role);
                quizController.getQuizAttempts(ctx);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(401).json(Map.of("error", "Invalid or expired token"));
            }
        });

        app.get("/api/quizzes/{id}/analytics", ctx -> {
            System.out.println("=== Quiz Analytics Route ===");
            System.out.println("Request path: " + ctx.path());
            System.out.println("Quiz ID: " + ctx.pathParam("id"));
            System.out.println("Auth header: " + ctx.header("Authorization"));
            try {
                String token = ctx.header("Authorization");
                if (token == null || !token.startsWith("Bearer ")) {
                    ctx.status(401).json(Map.of("error", "Authentication required"));
                    return;
                }
                token = token.substring(7);
                SecurityUtils.verifyToken(token);
                Long userId = SecurityUtils.getUserIdFromToken(token);
                User.UserRole role = SecurityUtils.getRoleFromToken(token);
                System.out.println("User ID: " + userId);
                System.out.println("User Role: " + role);
                if (role != User.UserRole.INSTRUCTOR) {
                    ctx.status(403).json(Map.of("error", "Instructor access required"));
                    return;
                }
                ctx.attribute("userId", userId);
                ctx.attribute("userRole", role);
                quizController.getQuizAnalytics(ctx);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(401).json(Map.of("error", "Invalid or expired token"));
            }
        });

        app.get("/api/quizzes/{id}/report", ctx -> {
            System.out.println("=== Quiz Report Route ===");
            System.out.println("Request path: " + ctx.path());
            System.out.println("Quiz ID: " + ctx.pathParam("id"));
            System.out.println("Auth header: " + ctx.header("Authorization"));
            try {
                String token = ctx.header("Authorization");
                if (token == null || !token.startsWith("Bearer ")) {
                    ctx.status(401).json(Map.of("error", "Authentication required"));
                    return;
                }
                token = token.substring(7);
                SecurityUtils.verifyToken(token);
                Long userId = SecurityUtils.getUserIdFromToken(token);
                User.UserRole role = SecurityUtils.getRoleFromToken(token);
                System.out.println("User ID: " + userId);
                System.out.println("User Role: " + role);
                if (role != User.UserRole.INSTRUCTOR) {
                    ctx.status(403).json(Map.of("error", "Instructor access required"));
                    return;
                }
                ctx.attribute("userId", userId);
                ctx.attribute("userRole", role);
                quizController.generateQuizReport(ctx);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(401).json(Map.of("error", "Invalid or expired token"));
            }
        });

        app.post("/api/quizzes/{id}/start", quizController::startQuiz, User.UserRole.STUDENT);
        app.post("/api/quizzes/{id}/submit", quizController::submitQuiz, User.UserRole.STUDENT);
        app.get("/api/quizzes/{id}/submission", quizController::getSubmission, User.UserRole.STUDENT);
        app.get("/api/submissions/{id}", quizController::getSubmissionById);

        // Get port from environment variable or use default
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        app.start(port);
    }

    private static void initializeDatabase() {
        String dbUrl = System.getenv().getOrDefault("DATABASE_URL", 
            "postgresql://quiz_platform_db_user:EZ8IhYi0YV4G19zHmYmGE6kN4Rgkdj7d@dpg-d14ib7h5pdvs73f77kdg-a.singapore-postgres.render.com/quiz_platform_db");

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setMaximumPoolSize(10);
        dataSource = new HikariDataSource(config);
    }

    private static void runMigrations() {
        try {
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .outOfOrder(true)
                .validateOnMigrate(false)
                .cleanDisabled(false)  
                .load();

            flyway.repair();

            flyway.migrate();
            
            System.out.println("Database migrations completed successfully");
        } catch (Exception e) {
            System.err.println("Error running migrations: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    public static HikariDataSource getDataSource() {
        return dataSource;
    }
} 