package com.foodbite.servlet;

import com.foodbite.config.AppConfig;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class StaticFileServlet extends HttpServlet {

    private String getMimeType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        if (uri == null || uri.equals("/") || uri.isEmpty()) {
            uri = "/index.html";
        }

        String decoded = URLDecoder.decode(uri, StandardCharsets.UTF_8);
        if (decoded.startsWith("/")) decoded = decoded.substring(1);
        if (decoded.contains("..")) {
            resp.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid path");
            return;
        }

        File file = new File(AppConfig.getStaticDocBase(), decoded);
        if (!file.exists() || file.isDirectory()) {
            file = new File(AppConfig.getStaticDocBase(), "index.html");
        }

        if (!file.exists()) {
            resp.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        resp.setContentType(getMimeType(file.getName()));
        resp.setContentLengthLong(file.length());

        if (file.getName().endsWith(".html")) {
            resp.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else {
            resp.setHeader("Cache-Control", "public, max-age=86400");
        }

        try (FileInputStream fis = new FileInputStream(file);
             OutputStream os = resp.getOutputStream()) {
            byte[] buf = new byte[65536];
            int read;
            while ((read = fis.read(buf)) != -1) {
                os.write(buf, 0, read);
            }
        }
    }
}
