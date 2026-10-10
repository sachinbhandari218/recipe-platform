package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.dao.*;
import com.foodbite.model.*;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.*;

public class StateServlet extends HttpServlet {
    private final UserDao userDao = new UserDaoJdbc();
    private final RecipeDao recipeDao = new RecipeDaoJdbc();
    private final ReviewDao reviewDao = new ReviewDaoJdbc();
    private final ActivityDao activityDao = new ActivityDaoJdbc();
    private final SettingDao settingDao = new SettingDaoJdbc();
    private final AnnouncementDao announcementDao = new AnnouncementDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("users", userDao.findAll());
        state.put("recipes", recipeDao.findAll());
        state.put("reviews", reviewDao.findAll());
        state.put("interactions", Collections.emptyList());
        state.put("activities", activityDao.findRecent(30));
        state.put("settings", settingDao.getAllSettings());
        state.put("deleted_recipe_ids", Collections.emptyList());
        state.put("announcement", announcementDao.getAnnouncement());

        resp.getWriter().write(JsonUtil.toJson(state));
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        String body = sb.toString().trim();
        if (body.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Empty payload\"}");
            return;
        }

        try {
            Map<String, Object> payload = JsonUtil.fromJson(body, new TypeReference<Map<String, Object>>() {});
            if (payload != null) {
                if (payload.get("recipes") instanceof List<?> recipeList) {
                    for (Object item : recipeList) {
                        try {
                            String itemJson = JsonUtil.toJson(item);
                            Recipe r = JsonUtil.fromJson(itemJson, Recipe.class);
                            if (r != null && r.getId() != null && !r.getId().trim().isEmpty()) {
                                recipeDao.save(r);
                            }
                        } catch (Exception ignored) {}
                    }
                }

                if (payload.get("reviews") instanceof List<?> reviewList) {
                    for (Object item : reviewList) {
                        try {
                            String itemJson = JsonUtil.toJson(item);
                            Review rv = JsonUtil.fromJson(itemJson, Review.class);
                            if (rv != null && rv.getId() != null && !rv.getId().trim().isEmpty()) {
                                reviewDao.save(rv);
                            }
                        } catch (Exception ignored) {}
                    }
                }

                if (payload.get("users") instanceof List<?> userList) {
                    for (Object item : userList) {
                        try {
                            String itemJson = JsonUtil.toJson(item);
                            User u = JsonUtil.fromJson(itemJson, User.class);
                            if (u != null && u.getId() != null && !u.getId().trim().isEmpty()) {
                                userDao.save(u);
                            }
                        } catch (Exception ignored) {}
                    }
                }

                if (payload.get("settings") instanceof Map<?, ?> settingsMap) {
                    Map<String, String> stringSettings = new HashMap<>();
                    for (Map.Entry<?, ?> entry : settingsMap.entrySet()) {
                        if (entry.getKey() != null && entry.getValue() != null) {
                            stringSettings.put(entry.getKey().toString(), entry.getValue().toString());
                        }
                    }
                    settingDao.saveSettings(stringSettings);
                }

                if (payload.get("deleted_recipe_ids") instanceof List<?> delList) {
                    for (Object delId : delList) {
                        if (delId != null) {
                            recipeDao.delete(delId.toString());
                        }
                    }
                }
            }
            resp.getWriter().write("{\"success\":true,\"message\":\"State synchronized with MySQL\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        String deleteId = req.getParameter("deleteId");
        if (deleteId != null && !deleteId.trim().isEmpty()) {
            recipeDao.delete(deleteId.trim());
            resp.getWriter().write("{\"success\":true,\"message\":\"Deleted " + deleteId + "\"}");
        } else {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"deleteId parameter required\"}");
        }
    }
}
