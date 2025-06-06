package com.quizplatform.controllers;

import com.quizplatform.models.User;
import com.quizplatform.repositories.UserRepository;
import com.quizplatform.utils.SecurityUtils;
import io.javalin.http.Context;
import java.util.List;
import java.util.Map;

public class UserController extends BaseController {
    private final UserRepository userRepository;

    public UserController() {
        this.userRepository = new UserRepository();
    }

    public void register(Context ctx) {
        try {
            User user = parseBody(ctx, User.class);
            
            // Validate required fields
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                errorResponse(ctx, 400, "Email is required");
                return;
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                errorResponse(ctx, 400, "Password is required");
                return;
            }
            if (user.getFirstName() == null || user.getFirstName().trim().isEmpty()) {
                errorResponse(ctx, 400, "First name is required");
                return;
            }
            if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
                errorResponse(ctx, 400, "Last name is required");
                return;
            }
            if (user.getRole() == null) {
                errorResponse(ctx, 400, "Role is required");
                return;
            }

            // Convert role string to enum if needed
            if (user.getRole() == null && ctx.body() != null) {
                try {
                    Map<String, Object> body = ctx.bodyAsClass(Map.class);
                    String roleStr = (String) body.get("role");
                    if (roleStr != null) {
                        user.setRole(User.UserRole.valueOf(roleStr));
                    }
                } catch (Exception e) {
                    errorResponse(ctx, 400, "Invalid role. Must be either 'STUDENT' or 'INSTRUCTOR'");
                    return;
                }
            }
            
            // Check if user already exists
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                errorResponse(ctx, 400, "User with this email already exists");
                return;
            }

            // Hash password before saving
            user.setPassword(SecurityUtils.hashPassword(user.getPassword()));
            User createdUser = userRepository.create(user);
            
            // Generate JWT token
            String token = SecurityUtils.generateToken(createdUser);
            
            // Return user and token
            jsonResponse(ctx, Map.of(
                "user", createdUser,
                "token", token
            ));
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error registering user: " + e.getMessage());
        }
    }

    public void login(Context ctx) {
        try {
            Map<String, String> loginRequest = ctx.bodyAsClass(Map.class);
            String email = loginRequest.get("email");
            String password = loginRequest.get("password");

            if (email == null || email.trim().isEmpty()) {
                errorResponse(ctx, 400, "Email is required");
                return;
            }
            if (password == null || password.trim().isEmpty()) {
                errorResponse(ctx, 400, "Password is required");
                return;
            }

            userRepository.findByEmail(email)
                .filter(user -> SecurityUtils.verifyPassword(password, user.getPassword()))
                .ifPresentOrElse(
                    user -> {
                        String token = SecurityUtils.generateToken(user);
                        jsonResponse(ctx, Map.of(
                            "user", user,
                            "token", token
                        ));
                    },
                    () -> errorResponse(ctx, 401, "Invalid email or password")
                );
        } catch (Exception e) {
            e.printStackTrace();
            errorResponse(ctx, 500, "Error during login: " + e.getMessage());
        }
    }

    public void getProfile(Context ctx) {
        String path = ctx.path();
        Long userId;
        
        if (path.endsWith("/me")) {
            userId = (Long) ctx.attribute("userId");
        } else {
            userId = Long.parseLong(ctx.pathParam("id"));
        }
        
        // Check if user is accessing their own profile or is an instructor
        Long authenticatedUserId = (Long) ctx.attribute("userId");
        User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
        
        if (!userId.equals(authenticatedUserId) && userRole != User.UserRole.INSTRUCTOR) {
            errorResponse(ctx, 403, "Access denied");
            return;
        }

        userRepository.findById(userId)
            .ifPresentOrElse(
                user -> jsonResponse(ctx, user),
                () -> errorResponse(ctx, 404, "User not found")
            );
    }

    public void updateProfile(Context ctx) {
        Long userId = Long.parseLong(ctx.pathParam("id"));
        // Check if user is updating their own profile
        Long authenticatedUserId = (Long) ctx.attribute("userId");
        if (!userId.equals(authenticatedUserId)) {
            errorResponse(ctx, 403, "Can only update own profile");
            return;
        }

        User updatedUser = parseBody(ctx, User.class);
        updatedUser.setId(userId);

        userRepository.findById(userId)
            .ifPresentOrElse(
                existingUser -> {
                    // Don't allow role changes through profile update
                    updatedUser.setRole(existingUser.getRole());
                    // Hash password if it's being updated
                    if (updatedUser.getPassword() != null && !updatedUser.getPassword().equals(existingUser.getPassword())) {
                        updatedUser.setPassword(SecurityUtils.hashPassword(updatedUser.getPassword()));
                    } else {
                        updatedUser.setPassword(existingUser.getPassword());
                    }
                    User savedUser = userRepository.update(updatedUser);
                    jsonResponse(ctx, savedUser);
                },
                () -> errorResponse(ctx, 404, "User not found")
            );
    }

    public void getAllUsers(Context ctx) {
        // Only instructors can see all users
        User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
        if (userRole != User.UserRole.INSTRUCTOR) {
            errorResponse(ctx, 403, "Instructor access required");
            return;
        }

        List<User> users = userRepository.findAll();
        jsonResponse(ctx, users);
    }

    public void deleteUser(Context ctx) {
        Long userId = Long.parseLong(ctx.pathParam("id"));
        // Only instructors can delete users
        User.UserRole userRole = (User.UserRole) ctx.attribute("userRole");
        if (userRole != User.UserRole.INSTRUCTOR) {
            errorResponse(ctx, 403, "Instructor access required");
            return;
        }

        userRepository.findById(userId)
            .ifPresentOrElse(
                user -> {
                    userRepository.delete(userId);
                    ctx.status(204);
                },
                () -> errorResponse(ctx, 404, "User not found")
            );
    }
} 