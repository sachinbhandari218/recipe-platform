package com.foodbite.servlet;

import com.foodbite.config.AppConfig;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class HealthServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        Map<String, Object> map = new HashMap<>();
        map.put("status", "healthy");
        map.put("platform", "FoodBite — Online Recipe Sharing Platform");
        map.put("developer", "Sachin Bhandari");
        map.put("architecture", "Jakarta Servlets 6.0 & Apache Tomcat");
        map.put("database", "MySQL 8.0 via JDBC & HikariCP");
        map.put("port", AppConfig.getPort());
        resp.getWriter().write(JsonUtil.toJson(map));
    }

    @Override
    protected void doHead(HttpServletRequest req, HttpServletResponse resp) {
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}
