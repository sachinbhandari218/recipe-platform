package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.FollowDao;
import com.foodbite.dao.FollowDaoJdbc;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FollowServlet extends HttpServlet {
    private final FollowDao followDao = new FollowDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        String userId = req.getParameter("userId");
        if (userId == null || userId.trim().isEmpty()) userId = "usr-1";

        List<String> following = followDao.getFollowingOf(userId);
        List<String> followers = followDao.getFollowersOf(userId);

        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("following", following);
        map.put("followers", followers);
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
            String followerId = body != null ? body.get("followerId") : null;
            String followingId = body != null ? body.get("followingId") : null;
            String action = body != null ? body.get("action") : "toggle";

            if (followerId == null || followingId == null || followerId.equals(followingId)) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\":false,\"message\":\"Invalid follower or target id\"}");
                return;
            }

            boolean isFollowing = followDao.toggleFollow(followerId, followingId, action);
            int count = followDao.getFollowersOf(followingId).size();

            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("isFollowing", isFollowing);
            map.put("followerCount", count);

            resp.getWriter().write(JsonUtil.toJson(map));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\":false,\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
