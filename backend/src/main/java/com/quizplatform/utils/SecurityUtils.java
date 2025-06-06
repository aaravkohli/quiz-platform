package com.quizplatform.utils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.quizplatform.models.User;
import at.favre.lib.crypto.bcrypt.BCrypt;

import java.util.Date;

public class SecurityUtils {
    private static final String JWT_SECRET = "your-secret-key"; // TODO: Move to environment variable
    private static final Algorithm algorithm = Algorithm.HMAC256(JWT_SECRET);
    private static final JWTVerifier verifier = JWT.require(algorithm).build();
    private static final long TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

    public static String hashPassword(String password) {
        return BCrypt.withDefaults().hashToString(12, password.toCharArray());
    }

    public static boolean verifyPassword(String password, String hashedPassword) {
        BCrypt.Result result = BCrypt.verifyer().verify(password.toCharArray(), hashedPassword);
        return result.verified;
    }

    public static String generateToken(User user) {
        return JWT.create()
                .withSubject(user.getId().toString())
                .withClaim("email", user.getEmail())
                .withClaim("role", user.getRole().name())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + TOKEN_EXPIRATION))
                .sign(algorithm);
    }

    public static DecodedJWT verifyToken(String token) {
        return verifier.verify(token);
    }

    public static Long getUserIdFromToken(String token) {
        DecodedJWT jwt = verifyToken(token);
        return Long.parseLong(jwt.getSubject());
    }

    public static User.UserRole getRoleFromToken(String token) {
        DecodedJWT jwt = verifyToken(token);
        return User.UserRole.valueOf(jwt.getClaim("role").asString());
    }
} 