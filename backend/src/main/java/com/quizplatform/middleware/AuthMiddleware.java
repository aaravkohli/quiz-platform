package com.quizplatform.middleware;

import com.quizplatform.models.User;
import com.quizplatform.utils.SecurityUtils;
import io.javalin.http.Context;
import io.javalin.http.Handler;

public class AuthMiddleware {
    public static Handler requireAuth = ctx -> {
        String token = extractToken(ctx);
        if (token == null) {
            ctx.status(401).json(new ErrorResponse("Authentication required"));
            return;
        }

        try {
            SecurityUtils.verifyToken(token);
            ctx.attribute("userId", SecurityUtils.getUserIdFromToken(token));
            ctx.attribute("userRole", SecurityUtils.getRoleFromToken(token));
        } catch (Exception e) {
            ctx.status(401).json(new ErrorResponse("Invalid or expired token"));
        }
    };

    public static Handler requireInstructor = ctx -> {
        requireAuth.handle(ctx);
        if (ctx.status().getCode() == 401) return;

        User.UserRole role = (User.UserRole) ctx.attribute("userRole");
        if (role != User.UserRole.INSTRUCTOR) {
            ctx.status(403).json(new ErrorResponse("Instructor access required"));
        }
    };

    public static Handler requireStudent = ctx -> {
        requireAuth.handle(ctx);
        if (ctx.status().getCode() == 401) return;

        User.UserRole role = (User.UserRole) ctx.attribute("userRole");
        if (role != User.UserRole.STUDENT) {
            ctx.status(403).json(new ErrorResponse("Student access required"));
        }
    };

    private static String extractToken(Context ctx) {
        String authHeader = ctx.header("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    private static class ErrorResponse {
        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
} 