package com.foodbite.config;

import java.io.File;

public class AppConfig {
    private static int port = 8080;
    private static String uploadsDir = "uploads";
    private static String staticDocBase = ".";

    static {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                port = Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }
        File uploadFolder = new File(uploadsDir);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
    }

    public static int getPort() {
        return port;
    }

    public static String getUploadsDir() {
        return uploadsDir;
    }

    public static String getStaticDocBase() {
        return staticDocBase;
    }
}
