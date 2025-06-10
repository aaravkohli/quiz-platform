package com.quizplatform.config;

public class AppConfig {
    private static final String JWT_SECRET_ENV = "JWT_SECRET";
    private static final String DEFAULT_JWT_SECRET = "your-secret-key"; // Fallback for development

    public static String getJwtSecret() {
        String secret = System.getenv(JWT_SECRET_ENV);
        if (secret == null || secret.trim().isEmpty()) {
            return DEFAULT_JWT_SECRET;
        }
        return secret;
    }
} 