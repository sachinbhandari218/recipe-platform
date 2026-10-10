package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.LikeDao;
import com.foodbite.dao.LikeDaoJdbc;
import com.foodbite.model.Like;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LikeServlet extends HttpServlet {
    private final LikeDao likeDao = new LikeDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        String postId = req.getParameter("postId");
        if (postId == null) postId = "";

        List<Like> likes = likeDao.findByTargetId(postId);
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("count", likes.size());
        map.put("likes", likes);
        resp.getWriter().write(JsonUtil.toJson(map));
    }

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
            String postId = body != null ? body.get("postId") : null;
            String userId = body != null ? body.get("userId") : "usr-1";
            String username = body != null ? body.get("username") : "Chef";
            String userAvatar = body != null ? body.get("userAvatar") : "/uploads/avatars/sachin.svg";

            if (postId == null || postId.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"postId required\"}");
                return;
            }

            boolean isLiked = likeDao.toggleLike(postId, userId, username, userAvatar);
            int newCount = likeDao.getLikeCount(postId);

            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("isLiked", isLiked);
            map.put("likeCount", newCount);

            resp.getWriter().write(JsonUtil.toJson(map));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
