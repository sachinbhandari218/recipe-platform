package com.foodbite.servlet;

import com.foodbite.dao.AnnouncementDao;
import com.foodbite.dao.AnnouncementDaoJdbc;
import com.foodbite.dao.EphemeralPostDao;
import com.foodbite.dao.EphemeralPostDaoJdbc;
import com.foodbite.model.EphemeralPost;
import com.foodbite.util.JsonUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class FeedServlet extends HttpServlet {
    private final EphemeralPostDao postDao = new EphemeralPostDaoJdbc();
    private final AnnouncementDao announcementDao = new AnnouncementDaoJdbc();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");
        postDao.purgeExpired();
        List<EphemeralPost> posts = postDao.findActive();

        Map<String, Object> map = new HashMap<>();
        map.put("success", true);
        map.put("posts", posts);
        map.put("announcement", announcementDao.getAnnouncement());

        resp.getWriter().write(JsonUtil.toJson(map));
    }
}
