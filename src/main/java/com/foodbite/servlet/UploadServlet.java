package com.foodbite.servlet;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.config.AppConfig;
import com.foodbite.dao.EphemeralPostDao;
import com.foodbite.dao.EphemeralPostDaoJdbc;
import com.foodbite.dao.UserDao;
import com.foodbite.dao.UserDaoJdbc;
import com.foodbite.model.EphemeralPost;
import com.foodbite.util.JsonUtil;
import com.foodbite.util.SecurityUtil;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class UploadServlet extends HttpServlet {
    private final EphemeralPostDao postDao = new EphemeralPostDaoJdbc();
    private final UserDao userDao = new UserDaoJdbc();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json; charset=UTF-8");

        String contentType = req.getContentType();
        if (contentType == null) contentType = "";
        String query = req.getQueryString();

        File uploadsDir = new File(AppConfig.getUploadsDir());
        if (!uploadsDir.exists()) uploadsDir.mkdirs();

        boolean isVideo = contentType.toLowerCase().contains("video") ||
                (query != null && query.toLowerCase().contains("type=video"));

        if (isVideo || contentType.toLowerCase().contains("octet-stream")) {
            String extension = ".mp4";
            if (contentType.toLowerCase().contains("webm") || (query != null && query.toLowerCase().contains("webm"))) {
                extension = ".webm";
            } else if (contentType.toLowerCase().contains("quicktime") || (query != null && query.toLowerCase().contains("mov"))) {
                extension = ".mov";
            }

            String filename = "video_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000) + extension;
            filename = SecurityUtil.sanitizeFilename(filename);
            File targetFile = new File(uploadsDir, filename);

            try (InputStream is = req.getInputStream();
                 OutputStream fos = new FileOutputStream(targetFile)) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, read);
                }
            }

            String fileUrl = "/uploads/" + filename;
            Map<String, Object> map = new HashMap<>();
            map.put("success", true);
            map.put("url", fileUrl);
            map.put("filename", filename);
            map.put("type", "video");
            resp.getWriter().write(JsonUtil.toJson(map));
            return;
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (InputStream is = req.getInputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) != -1) baos.write(buffer, 0, read);
        }
        String rawBody = baos.toString(StandardCharsets.UTF_8).trim();

        String base64Data = "";
        String extension = ".jpg";
        String caption = "";
        String userId = "usr-1";
        String username = "chef";
        String avatar = "/uploads/avatars/sachin.svg";
        String category = "dinner";
        double duration = 0.0;

        if (rawBody.startsWith("{")) {
            try {
                Map<String, Object> json = JsonUtil.fromJson(rawBody, new TypeReference<Map<String, Object>>() {});
                if (json != null) {
                    if (json.containsKey("image")) base64Data = json.get("image").toString();
                    else if (json.containsKey("mediaBase64")) base64Data = json.get("mediaBase64").toString();
                    else if (json.containsKey("media")) base64Data = json.get("media").toString();

                    if (json.get("caption") != null) caption = json.get("caption").toString();
                    if (json.get("userId") != null) userId = json.get("userId").toString();
                    if (json.get("username") != null) username = json.get("username").toString();
                    if (json.get("userAvatar") != null) avatar = json.get("userAvatar").toString();
                    if (json.get("category") != null) category = json.get("category").toString();
                    if (json.get("duration") != null) {
                        try { duration = Double.parseDouble(json.get("duration").toString()); } catch (Exception ignored) {}
                    }
                }
            } catch (Exception ignored) {}
        }
        if (base64Data == null || base64Data.isEmpty()) {
            base64Data = rawBody;
        }

        if (base64Data.contains(",")) {
            String prefix = base64Data.substring(0, base64Data.indexOf(",")).toLowerCase();
            if (prefix.contains("png")) extension = ".png";
            else if (prefix.contains("webp")) extension = ".webp";
            else if (prefix.contains("gif")) extension = ".gif";
            else if (prefix.contains("mp4")) extension = ".mp4";
            else if (prefix.contains("webm")) extension = ".webm";
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        base64Data = base64Data.replaceAll("\\s+", "").replace("\\/", "/").replace("-", "+").replace("_", "/");
        while (base64Data.length() % 4 != 0) {
            base64Data += "=";
        }

        byte[] imageBytes;
        try {
            imageBytes = Base64.getMimeDecoder().decode(base64Data);
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid image data encoding\"}");
            return;
        }

        if (imageBytes.length == 0 || imageBytes.length > 15 * 1024 * 1024) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Uploaded image data is empty or exceeds 15MB limit\"}");
            return;
        }

        String filename = (extension.equals(".mp4") || extension.equals(".webm") ? "video_" : "dish_") +
                System.currentTimeMillis() + "_" + (int)(Math.random() * 10000) + extension;
        filename = SecurityUtil.sanitizeFilename(filename);
        File targetFile = new File(uploadsDir, filename);
        Files.write(targetFile.toPath(), imageBytes);

        String fileUrl = "/uploads/" + filename;

        if (!caption.isEmpty() || !userId.equals("usr-1")) {
            long now = System.currentTimeMillis();
            long expiresAt = now + 86400000L;
            EphemeralPost post = new EphemeralPost();
            post.setId("post_" + now + "_" + (int)(Math.random() * 1000));
            post.setUserId(userId);
            post.setUsername(username);
            post.setUserAvatar(avatar);
            post.setMediaUrl(fileUrl);
            post.setMediaPath("uploads/" + filename);
            post.setMediaType(extension.equals(".mp4") ? "video" : "image");
            post.setCategory(category);
            post.setCaption(caption);
            post.setDuration(duration);
            post.setCreatedAt(now);
            post.setExpiresAt(expiresAt);

            postDao.save(post);
            userDao.updateStreak(userId);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("url", fileUrl);
        res.put("filename", filename);
        res.put("type", extension.equals(".mp4") ? "video" : "image");

        resp.getWriter().write(JsonUtil.toJson(res));
    }
}
