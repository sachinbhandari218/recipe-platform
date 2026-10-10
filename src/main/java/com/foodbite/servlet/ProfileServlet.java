package com.foodbite.servlet;

import com.foodbite.dao.EphemeralPostDao;
import com.foodbite.dao.EphemeralPostDaoJdbc;
import com.foodbite.dao.UserDao;
import com.foodbite.dao.UserDaoJdbc;
import com.foodbite.model.EphemeralPost;
import com.foodbite.model.User;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class ProfileServlet extends HttpServlet {
    private final UserDao userDao = new UserDaoJdbc();
    private final EphemeralPostDao postDao = new EphemeralPostDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        String userId = req.getParameter("userId");
        if (userId == null || userId.trim().isEmpty()) {
            userId = "usr-1";
        }

        Optional<User> uOpt = userDao.findById(userId.trim());
        User user = uOpt.orElseGet(() -> {
            User def = new User();
            def.setId(req.getParameter("userId"));
            def.setUsername("chef");
            def.setEmail("chef@recipes.com");
            def.setAvatarUrl("/uploads/avatars/sachin.svg");
            def.setStreak(0);
            return def;
        });

        List<EphemeralPost> activePosts = postDao.findActiveByUser(user.getId());

        Map<String, Object> uMap = new HashMap<>();
        uMap.put("id", user.getId());
        uMap.put("username", user.getUsername());
        uMap.put("email", user.getEmail());
        uMap.put("avatarUrl", user.getAvatarUrl());
        uMap.put("streak", user.getStreak());
        uMap.put("hoursRemaining", 24.0);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("user", uMap);
        res.put("activePosts", activePosts);

        resp.getWriter().write(JsonUtil.toJson(res));
    }
}
