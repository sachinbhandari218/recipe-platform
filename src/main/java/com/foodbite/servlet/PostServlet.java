package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.EphemeralPostDao;
import com.foodbite.dao.EphemeralPostDaoJdbc;
import com.foodbite.dao.UserDao;
import com.foodbite.dao.UserDaoJdbc;
import com.foodbite.model.EphemeralPost;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PostServlet extends HttpServlet {
    private final EphemeralPostDao postDao = new EphemeralPostDaoJdbc();
    private final UserDao userDao = new UserDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        List<EphemeralPost> posts = postDao.findActive();
        resp.getWriter().write(JsonUtil.toJson(posts));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        String body = sb.toString().trim();

        try {
            Map<String, Object> map = JsonUtil.fromJson(body, new TypeReference<Map<String, Object>>() {});
            if (map != null && map.containsKey("sync") && map.containsKey("posts")) {
                int count = 0;
                if (map.get("posts") instanceof List<?> list) {
                    for (Object pObj : list) {
                        try {
                            EphemeralPost post = JsonUtil.fromJson(JsonUtil.toJson(pObj), EphemeralPost.class);
                            if (post != null && post.getId() != null) {
                                postDao.save(post);
                                count++;
                            }
                        } catch (Exception ignored) {}
                    }
                }
                resp.getWriter().write("{\"success\":true,\"synced\":" + count + "}");
                return;
            }

            EphemeralPost post = JsonUtil.fromJson(body, EphemeralPost.class);
            if (post == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Invalid post data\"}");
                return;
            }

            long now = System.currentTimeMillis();
            if (post.getId() == null || post.getId().trim().isEmpty()) {
                post.setId("post_" + now + "_" + (int)(Math.random() * 1000));
            }
            if (post.getCreatedAt() <= 0) post.setCreatedAt(now);
            if (post.getExpiresAt() <= 0) post.setExpiresAt(now + 86400000L);

            postDao.save(post);
            int streak = userDao.updateStreak(post.getUserId());

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("post", post);
            res.put("currentStreak", streak);
            res.put("hoursRemaining", 24.0);

            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write(JsonUtil.toJson(res));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }
        try {
            Map<String, String> map = JsonUtil.fromJson(sb.toString(), new TypeReference<Map<String, String>>() {});
            String postId = map != null ? map.get("postId") : null;
            String userId = map != null ? map.get("userId") : null;

            if (postId == null || userId == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"postId and userId required\"}");
                return;
            }

            boolean deleted = postDao.delete(postId, userId);
            if (deleted) {
                resp.getWriter().write("{\"success\":true,\"deleted\":true}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"success\":false,\"error\":\"Post not found or unauthorized\"}");
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
