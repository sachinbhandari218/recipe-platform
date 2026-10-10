package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.service.AuthService;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class AuthSignupServlet extends HttpServlet {
    private final AuthService authService = new AuthService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }

        try {
            Map<String, String> body = JsonUtil.fromJson(sb.toString(), new TypeReference<Map<String, String>>() {});
            if (body == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\":false,\"message\":\"Invalid request\"}");
                return;
            }

            String fullName = body.get("fullName");
            if (fullName == null) fullName = body.get("name");
            String email = body.get("email");
            String password = body.get("password");
            String username = body.get("username");

            AuthService.AuthResult result = authService.register(fullName, email, password, username, "user");

            Map<String, Object> uMap = new HashMap<>();
            uMap.put("id", result.getUser().getId());
            uMap.put("email", result.getUser().getEmail());
            uMap.put("name", result.getUser().getName());
            uMap.put("username", result.getUser().getUsername());
            uMap.put("avatar", result.getUser().getAvatarUrl());
            uMap.put("streak", result.getUser().getStreak());

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("token", result.getToken());
            res.put("user", uMap);

            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write(JsonUtil.toJson(res));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"success\":false,\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
