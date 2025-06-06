package com.quizplatform.models;

import io.javalin.security.RouteRole;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private UserRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum UserRole implements RouteRole {
        INSTRUCTOR,
        STUDENT
    }
} 