package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.AnnouncementDao;
import com.foodbite.dao.AnnouncementDaoJdbc;
import com.foodbite.model.Announcement;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class AnnouncementServlet extends HttpServlet {
    private final AnnouncementDao announcementDao = new AnnouncementDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        Announcement a = announcementDao.getAnnouncement();
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("announcement", a);
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
            Map<String, Object> body = JsonUtil.fromJson(sb.toString(), new TypeReference<Map<String, Object>>() {});
            Announcement a = new Announcement();
            a.setId(1);
            a.setEnabled(body != null && Boolean.parseBoolean(String.valueOf(body.get("enabled"))));
            a.setTitle(body != null && body.get("title") != null ? body.get("title").toString() : "Notice");
            a.setMessage(body != null && body.get("message") != null ? body.get("message").toString() : "");
            a.setType(body != null && body.get("type") != null ? body.get("type").toString() : "maintenance");
            a.setUpdatedBy("Sachin Bhandari (Admin)");
            a.setUpdatedAt(System.currentTimeMillis());

            announcementDao.saveAnnouncement(a);

            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("announcement", a);
            resp.getWriter().write(JsonUtil.toJson(map));
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
