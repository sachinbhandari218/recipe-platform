package com.foodbite.servlet;

import com.foodbite.dao.NotificationDao;
import com.foodbite.dao.NotificationDaoJdbc;
import com.foodbite.model.Notification;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NotificationServlet extends HttpServlet {
    private final NotificationDao notificationDao = new NotificationDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        String userId = req.getParameter("userId");
        if (userId == null || userId.trim().isEmpty()) userId = "usr-1";

        List<Notification> notifications = notificationDao.findByUserId(userId);
        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("notifications", notifications);
        resp.getWriter().write(JsonUtil.toJson(map));
    }
}
