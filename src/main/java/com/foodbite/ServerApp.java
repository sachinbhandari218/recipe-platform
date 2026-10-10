package com.foodbite;

import com.foodbite.config.AppConfig;
import com.foodbite.config.DatabaseConfig;
import com.foodbite.filter.CorsFilter;
import com.foodbite.filter.EncodingFilter;
import com.foodbite.servlet.*;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;

import java.io.File;

public class ServerApp {

    public static void main(String[] args) {
        int port = AppConfig.getPort();

        try {
            System.out.println("Initializing FoodBite Database connection pool...");
            DatabaseConfig.initialize();
            System.out.println("Database pool initialized and verified with MySQL.");

            Tomcat tomcat = new Tomcat();
            tomcat.setPort(port);
            tomcat.getConnector();

            String baseDir = new File(System.getProperty("java.io.tmpdir"), "tomcat_" + port).getAbsolutePath();
            tomcat.setBaseDir(baseDir);

            String docBase = new File(AppConfig.getStaticDocBase()).getAbsolutePath();
            Context ctx = tomcat.addContext("", docBase);

            FilterDef corsFilterDef = new FilterDef();
            corsFilterDef.setFilterName("CorsFilter");
            corsFilterDef.setFilterClass(CorsFilter.class.getName());
            ctx.addFilterDef(corsFilterDef);

            FilterMap corsFilterMap = new FilterMap();
            corsFilterMap.setFilterName("CorsFilter");
            corsFilterMap.addURLPattern("/*");
            ctx.addFilterMap(corsFilterMap);

            FilterDef encFilterDef = new FilterDef();
            encFilterDef.setFilterName("EncodingFilter");
            encFilterDef.setFilterClass(EncodingFilter.class.getName());
            ctx.addFilterDef(encFilterDef);

            FilterMap encFilterMap = new FilterMap();
            encFilterMap.setFilterName("EncodingFilter");
            encFilterMap.addURLPattern("/*");
            ctx.addFilterMap(encFilterMap);

            Tomcat.addServlet(ctx, "HealthServlet", new HealthServlet()).addMapping("/api/health");
            Tomcat.addServlet(ctx, "StateServlet", new StateServlet()).addMapping("/api/state");
            Tomcat.addServlet(ctx, "PostServlet", new PostServlet()).addMapping("/api/posts");
            Tomcat.addServlet(ctx, "FeedServlet", new FeedServlet()).addMapping("/api/feed");
            Tomcat.addServlet(ctx, "ProfileServlet", new ProfileServlet()).addMapping("/api/profile");
            Tomcat.addServlet(ctx, "AuthSignupServlet", new AuthSignupServlet()).addMapping("/api/auth/signup");
            Tomcat.addServlet(ctx, "AuthLoginServlet", new AuthLoginServlet()).addMapping("/api/auth/login");
            Tomcat.addServlet(ctx, "UploadServlet", new UploadServlet()).addMapping("/api/upload");
            Tomcat.addServlet(ctx, "LikeServlet", new LikeServlet()).addMapping("/api/likes");
            Tomcat.addServlet(ctx, "CommentServlet", new CommentServlet()).addMapping("/api/comments");
            Tomcat.addServlet(ctx, "FollowServlet", new FollowServlet()).addMapping("/api/follow");
            Tomcat.addServlet(ctx, "NotificationServlet", new NotificationServlet()).addMapping("/api/notifications");
            Tomcat.addServlet(ctx, "AnnouncementServlet", new AnnouncementServlet()).addMapping("/api/announcement");

            Tomcat.addServlet(ctx, "StaticFileServlet", new StaticFileServlet()).addMapping("/");

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    System.out.println("Shutting down Tomcat and Hikari pool...");
                    tomcat.stop();
                    DatabaseConfig.shutdown();
                } catch (Exception ignored) {}
            }));

            System.out.println("==================================================================");
            System.out.println("FoodBite — Online Recipe Sharing Platform (Jakarta Servlets & Tomcat)");
            System.out.println("Engineered & Designed by Sachin Bhandari");
            System.out.println("Server listening at: http://localhost:" + port);
            System.out.println("==================================================================");

            tomcat.start();
            tomcat.getServer().await();

        } catch (Exception e) {
            System.err.println("Failed to start FoodBite server: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
