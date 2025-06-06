package com.quizplatform.controllers;

import io.javalin.http.Context;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

public abstract class BaseController {
    protected final ObjectMapper objectMapper;

    protected BaseController() {
        this.objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    protected void jsonResponse(Context ctx, Object data) {
        ctx.contentType("application/json");
        try {
            String json = objectMapper.writeValueAsString(data);
            ctx.result(json);
        } catch (Exception e) {
            e.printStackTrace();
            ctx.status(500).json(new ErrorResponse("Error serializing response: " + e.getMessage()));
        }
    }

    protected <T> T parseBody(Context ctx, Class<T> clazz) {
        try {
            return objectMapper.readValue(ctx.body(), clazz);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error parsing request body: " + e.getMessage(), e);
        }
    }

    protected void errorResponse(Context ctx, int status, String message) {
        ctx.status(status).json(new ErrorResponse(message));
    }

    protected static class ErrorResponse {
        private final String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }
} 