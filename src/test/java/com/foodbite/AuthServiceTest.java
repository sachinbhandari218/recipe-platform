package com.foodbite;

import com.foodbite.service.AuthService;
import com.foodbite.util.SecurityUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthServiceTest {

    @Test
    public void testPasswordHashing() {
        String raw = "secretPassword123";
        String hashed = SecurityUtil.hashPassword(raw);

        assertNotNull(hashed);
        assertTrue(hashed.startsWith("$2a$") || hashed.startsWith("$2b$"));
        assertTrue(SecurityUtil.checkPassword(raw, hashed));
        assertFalse(SecurityUtil.checkPassword("wrongPassword", hashed));
    }

    @Test
    public void testTokenGeneration() {
        String token1 = SecurityUtil.generateToken();
        String token2 = SecurityUtil.generateToken();

        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2);
        assertTrue(token1.startsWith("fb_tok_"));
    }

    @Test
    public void testFilenameSanitizer() {
        String unsafe = "../../evil/path/../dish.jpg";
        String clean = SecurityUtil.sanitizeFilename(unsafe);

        assertFalse(clean.contains(".."));
        assertFalse(clean.contains("/"));
        assertFalse(clean.contains("\\"));
    }
}
