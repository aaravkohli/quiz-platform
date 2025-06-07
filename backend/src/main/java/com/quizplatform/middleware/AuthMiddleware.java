package com.quizplatform.middleware;

import com.quizplatform.models.User;
import com.quizplatform.utils.SecurityUtils;
import io.javalin.http.Context;
import io.javalin.http.Handler;

public class AuthMiddleware {
    public static Handler requireAuth = ctx -> {
        System.out.println("=== Auth Middleware Debug ===");
        System.out.println("Request path: " + ctx.path());
        System.out.println("Auth header: " + ctx.header("Authorization"));
        
        String token = extractToken(ctx);
        if (token == null) {
            System.out.println("No token found in request");
            ctx.status(401).json(new ErrorResponse("Authentication required"));
            return;
        }

        try {
            System.out.println("Verifying token...");
            SecurityUtils.verifyToken(token);
            Long userId = SecurityUtils.getUserIdFromToken(token);
            User.UserRole role = SecurityUtils.getRoleFromToken(token);
            System.out.println("Token verified. User ID: " + userId + ", Role: " + role);
            
            ctx.attribute("userId", userId);
            ctx.attribute("userRole", role);
        } catch (Exception e) {
            System.out.println("Token verification failed: " + e.getMessage());
            e.printStackTrace();
            ctx.status(401).json(new ErrorResponse("Invalid or expired token"));
        }
    };

    public static Handler requireInstructor = ctx -> {
        System.out.println("=== Instructor Middleware Debug ===");
        System.out.println("Request path: " + ctx.path());
        
        requireAuth.handle(ctx);
        if (ctx.status().getCode() == 401) {
            System.out.println("Auth failed, returning 401");
            return;
        }

        User.UserRole role = (User.UserRole) ctx.attribute("userRole");
        System.out.println("User role: " + role);
        
        if (role != User.UserRole.INSTRUCTOR) {
            System.out.println("User is not an instructor, returning 403");
            ctx.status(403).json(new ErrorResponse("Instructor access required"));
        } else {
            System.out.println("User is an instructor, proceeding");
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