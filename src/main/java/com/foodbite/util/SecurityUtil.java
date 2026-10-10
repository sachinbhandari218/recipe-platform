package com.foodbite.util;

import org.mindrot.jbcrypt.BCrypt;

import java.security.SecureRandom;
import java.util.Base64;

public class SecurityUtil {
    private static final SecureRandom secureRandom = new SecureRandom();

    public static String hashPassword(String plaintext) {
        if (plaintext == null || plaintext.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        return BCrypt.hashpw(plaintext, BCrypt.gensalt(10));
    }

    public static boolean checkPassword(String plaintext, String hashed) {
        if (plaintext == null || hashed == null) return false;
        try {
            if (hashed.startsWith("$2a$") || hashed.startsWith("$2b$") || hashed.startsWith("$2y$")) {
                return BCrypt.checkpw(plaintext, hashed);
            }
            return plaintext.equals(hashed);
        } catch (Exception e) {
            return false;
        }
    }

    public static String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return "fb_tok_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null) return "upload_" + System.currentTimeMillis();
        String clean = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        clean = clean.replace("..", "_");
        if (clean.length() > 100) {
            clean = clean.substring(clean.length() - 100);
        }
        return clean;
    }
}
