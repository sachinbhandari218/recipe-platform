package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.CommentDao;
import com.foodbite.dao.CommentDaoJdbc;
import com.foodbite.model.Comment;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CommentServlet extends HttpServlet {
    private final CommentDao commentDao = new CommentDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        String postId = req.getParameter("postId");
        if (postId == null) postId = "";

        List<Comment> comments = commentDao.findByPostId(postId);
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("comments", comments);
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
            String text = body != null ? body.get("text") : "";

            if (postId == null || text == null || text.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"postId and text required\"}");
                return;
            }

            Comment c = new Comment();
            c.setId("cmt_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000));
            c.setPostId(postId);
            c.setUserId(userId);
            c.setUsername(username);
            c.setUserAvatar(userAvatar);
            c.setText(text.trim());

            commentDao.save(c);

            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("comment", c);

            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.getWriter().write(JsonUtil.toJson(map));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
