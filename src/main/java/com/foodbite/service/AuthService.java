package com.foodbite.service;

import com.foodbite.dao.UserDao;
import com.foodbite.dao.UserDaoJdbc;
import com.foodbite.exception.AuthenticationException;
import com.foodbite.exception.ValidationException;
import com.foodbite.model.User;
import com.foodbite.util.SecurityUtil;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class AuthService {
    private final UserDao userDao;
    private final Map<String, String> tokenToUserIdMap = new ConcurrentHashMap<>();

    public AuthService() {
        this.userDao = new UserDaoJdbc();
    }

    public AuthService(UserDao userDao) {
        this.userDao = userDao;
    }

    public static class AuthResult {
        private final String token;
        private final User user;

        public AuthResult(String token, User user) {
            this.token = token;
            this.user = user;
        }

        public String getToken() { return token; }
        public User getUser() { return user; }
    }

    public AuthResult register(String name, String email, String password, String username, String role) {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Full name is required");
        }
        if (email == null || !email.contains("@")) {
            throw new ValidationException("Valid email address is required");
        }
        if (password == null || password.length() < 5) {
            throw new ValidationException("Password must be at least 5 characters");
        }

        String cleanEmail = email.trim().toLowerCase();
        if (userDao.findByEmail(cleanEmail).isPresent()) {
            throw new ValidationException("Email address already registered");
        }

        String cleanUsername = (username != null && !username.trim().isEmpty())
                ? username.trim().toLowerCase().replaceAll("[^a-z0-9_]", "")
                : cleanEmail.split("@")[0];

        if (cleanUsername.isEmpty()) {
            cleanUsername = "chef_" + System.currentTimeMillis();
        }

        String userId = "usr-" + System.currentTimeMillis();
        String hashedPassword = SecurityUtil.hashPassword(password);
        String assignedRole = (role != null && role.equalsIgnoreCase("admin")) ? "admin" : "user";
        String avatar = "/uploads/avatars/sachin.svg";

        User newUser = new User(userId, cleanEmail, hashedPassword, name.trim(), name.trim(), cleanUsername, assignedRole, avatar, "Passionate FoodBite Chef", 0, null);
        userDao.save(newUser);

        String token = SecurityUtil.generateToken();
        tokenToUserIdMap.put(token, userId);
        return new AuthResult(token, newUser);
    }

    public AuthResult login(String usernameOrEmail, String password) {
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty()) {
            throw new ValidationException("Username or email is required");
        }
        if (password == null) {
            throw new ValidationException("Password is required");
        }

        String clean = usernameOrEmail.trim();
        Optional<User> userOpt = clean.contains("@")
                ? userDao.findByEmail(clean.toLowerCase())
                : userDao.findByUsername(clean.toLowerCase());

        if (userOpt.isEmpty()) {
            userOpt = userDao.findByUsername(clean.toLowerCase());
        }

        if (userOpt.isEmpty()) {
            throw new AuthenticationException("Invalid username or password");
        }

        User user = userOpt.get();
        if (!SecurityUtil.checkPassword(password, user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        int newStreak = userDao.updateStreak(user.getId());
        user.setStreak(newStreak);

        String token = SecurityUtil.generateToken();
        tokenToUserIdMap.put(token, user.getId());
        return new AuthResult(token, user);
    }

    public Optional<User> authenticateToken(String token) {
        if (token == null || token.trim().isEmpty()) return Optional.empty();
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        String userId = tokenToUserIdMap.get(cleanToken);
        if (userId != null) {
            return userDao.findById(userId);
        }
        return Optional.empty();
    }

    public void logout(String token) {
        if (token != null) {
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
            tokenToUserIdMap.remove(cleanToken);
        }
    }
}
