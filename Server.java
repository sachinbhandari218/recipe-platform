import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.File;
import java.io.FileInputStream;
import java.io.OutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.concurrent.Executors;
import java.util.List;
import java.util.ArrayList;

public class Server {
    private static int port = 8080;
    private static final String STATE_FILE_PATH = "data/server_state.json";
    private static String globalState = "{}";

    public static void main(String[] args) {
        try {
            String envPort = System.getenv("PORT");
            if (envPort != null && !envPort.trim().isEmpty()) {
                try {
                    port = Integer.parseInt(envPort.trim());
                } catch (NumberFormatException ignored) {}
            }

            loadPersistedState();

            HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
            server.setExecutor(Executors.newFixedThreadPool(10));

            server.createContext("/api/health", new HealthHandler());
            server.createContext("/api/state", new StateHandler());
            server.createContext("/api/upload", new UploadHandler());
            server.createContext("/api/feed", new FeedHandler());
            server.createContext("/api/posts", new PostsHandler());
            server.createContext("/api/profile", new ProfileHandler());
            server.createContext("/api/auth/signup", new AuthSignupHandler());
            server.createContext("/api/auth/login", new AuthLoginHandler());
            server.createContext("/api/follow", new FollowHandler());
            server.createContext("/api/notifications", new NotificationsHandler());
            server.createContext("/api/likes", new LikesHandler());
            server.createContext("/api/comments", new CommentsHandler());
            server.createContext("/api/announcement", new AnnouncementHandler());
            server.createContext("/", new StaticFileHandler());

            java.util.concurrent.ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor();
            cleanupExecutor.scheduleAtFixedRate(new Runnable() {
                @Override
                public void run() {
                    purgeExpiredEphemeralPosts();
                }
            }, 1, 10, java.util.concurrent.TimeUnit.MINUTES);

            server.start();

            if (port != 8080) {
                try {
                    HttpServer server8080 = HttpServer.create(new InetSocketAddress("0.0.0.0", 8080), 0);
                    server8080.setExecutor(Executors.newFixedThreadPool(10));
                    server8080.createContext("/api/health", new HealthHandler());
                    server8080.createContext("/api/state", new StateHandler());
                    server8080.createContext("/api/upload", new UploadHandler());
                    server8080.createContext("/api/feed", new FeedHandler());
                    server8080.createContext("/api/posts", new PostsHandler());
                    server8080.createContext("/api/profile", new ProfileHandler());
                    server8080.createContext("/api/auth/signup", new AuthSignupHandler());
                    server8080.createContext("/api/auth/login", new AuthLoginHandler());
                    server8080.createContext("/api/follow", new FollowHandler());
                    server8080.createContext("/api/notifications", new NotificationsHandler());
                    server8080.createContext("/api/likes", new LikesHandler());
                    server8080.createContext("/api/comments", new CommentsHandler());
                    server8080.createContext("/api/announcement", new AnnouncementHandler());
                    server8080.createContext("/", new StaticFileHandler());
                    server8080.start();
                } catch (Exception ignored) {}
            }

            System.out.println("Online Recipe Sharing Platform Server by Sachin Bhandari running at port " + port);
        } catch (IOException e) {
            System.err.println("Server error: " + e.getMessage());
        }
    }

    private static void loadPersistedState() {
        try {
            File file = new File(STATE_FILE_PATH);
            if (file.exists()) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                String content = new String(bytes, StandardCharsets.UTF_8).trim();
                if (!content.isEmpty() && !content.equals("{}")) {
                    globalState = content;
                }
            }
        } catch (Exception e) {}
    }

    private static synchronized void savePersistedState(String json) {
        globalState = json;
        try {
            File dir = new File("data");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            Files.write(Paths.get(STATE_FILE_PATH), json.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {}
    }

    private static synchronized void removeRecipeFromGlobalState(String deleteId) {
        if (deleteId == null || deleteId.isEmpty() || globalState == null) return;
        try {
            int recIndex = globalState.indexOf("\"recipes\":");
            if (recIndex != -1) {
                int startBracket = globalState.indexOf("[", recIndex);
                if (startBracket != -1) {
                    int bracketCount = 1;
                    int endBracket = -1;
                    for (int i = startBracket + 1; i < globalState.length(); i++) {
                        char c = globalState.charAt(i);
                        if (c == '[') bracketCount++;
                        else if (c == ']') {
                            bracketCount--;
                            if (bracketCount == 0) {
                                endBracket = i;
                                break;
                            }
                        }
                    }
                    if (endBracket != -1) {
                        String arrayContent = globalState.substring(startBracket + 1, endBracket).trim();
                        if (!arrayContent.isEmpty()) {
                            java.util.List<String> remaining = new java.util.ArrayList<>();
                            int braceCount = 0;
                            int itemStart = -1;
                            for (int i = 0; i < arrayContent.length(); i++) {
                                char c = arrayContent.charAt(i);
                                if (c == '{') {
                                    if (braceCount == 0) itemStart = i;
                                    braceCount++;
                                } else if (c == '}') {
                                    braceCount--;
                                    if (braceCount == 0 && itemStart != -1) {
                                        String item = arrayContent.substring(itemStart, i + 1);
                                        if (!item.contains("\"" + deleteId + "\"")) {
                                            remaining.add(item);
                                        }
                                        itemStart = -1;
                                    }
                                }
                            }
                            String newArray = String.join(",", remaining);
                            globalState = globalState.substring(0, startBracket + 1) + newArray + globalState.substring(endBracket);
                            savePersistedState(globalState);
                        }
                    }
                }
            }
        } catch (Exception e) {}
    }

    private static synchronized void saveUserToState(String newUserJson) {
        if (newUserJson == null || globalState == null) return;
        try {
            int usersIdx = globalState.indexOf("\"users\":");
            if (usersIdx != -1) {
                int startBracket = globalState.indexOf("[", usersIdx);
                if (startBracket != -1) {
                    int bracketCount = 1;
                    int endBracket = -1;
                    for (int i = startBracket + 1; i < globalState.length(); i++) {
                        char c = globalState.charAt(i);
                        if (c == '[') bracketCount++;
                        else if (c == ']') {
                            bracketCount--;
                            if (bracketCount == 0) {
                                endBracket = i;
                                break;
                            }
                        }
                    }
                    if (endBracket != -1) {
                        String arrayContent = globalState.substring(startBracket + 1, endBracket).trim();
                        String updatedUsers;
                        if (arrayContent.isEmpty()) {
                            updatedUsers = newUserJson;
                        } else {
                            updatedUsers = arrayContent + "," + newUserJson;
                        }
                        globalState = globalState.substring(0, startBracket + 1) + updatedUsers + globalState.substring(endBracket);
                        savePersistedState(globalState);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private static synchronized String findUserByEmail(String email) {
        if (email == null || email.isEmpty() || globalState == null) return null;
        try {
            int usersIdx = globalState.indexOf("\"users\":");
            if (usersIdx == -1) return null;
            int startBracket = globalState.indexOf("[", usersIdx);
            if (startBracket == -1) return null;
            int bracketCount = 1;
            int endBracket = -1;
            for (int i = startBracket + 1; i < globalState.length(); i++) {
                char c = globalState.charAt(i);
                if (c == '[') bracketCount++;
                else if (c == ']') {
                    bracketCount--;
                    if (bracketCount == 0) {
                        endBracket = i;
                        break;
                    }
                }
            }
            if (endBracket == -1) return null;
            String usersArray = globalState.substring(startBracket + 1, endBracket);
            int idx = 0;
            while ((idx = usersArray.indexOf("{", idx)) != -1) {
                int end = usersArray.indexOf("}", idx);
                if (end == -1) break;
                String user = usersArray.substring(idx, end + 1);
                String uEmail = extractJsonString(user, "email", "").trim().toLowerCase();
                if (uEmail.equalsIgnoreCase(email)) {
                    return user;
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static synchronized String findUserByCredentials(String email, String password) {
        if (email == null || password == null || globalState == null) return null;
        try {
            int usersIdx = globalState.indexOf("\"users\":");
            if (usersIdx == -1) return null;
            int startBracket = globalState.indexOf("[", usersIdx);
            if (startBracket == -1) return null;
            int bracketCount = 1;
            int endBracket = -1;
            for (int i = startBracket + 1; i < globalState.length(); i++) {
                char c = globalState.charAt(i);
                if (c == '[') bracketCount++;
                else if (c == ']') {
                    bracketCount--;
                    if (bracketCount == 0) {
                        endBracket = i;
                        break;
                    }
                }
            }
            if (endBracket == -1) return null;
            String usersArray = globalState.substring(startBracket + 1, endBracket);
            int idx = 0;
            while ((idx = usersArray.indexOf("{", idx)) != -1) {
                int end = usersArray.indexOf("}", idx);
                if (end == -1) break;
                String user = usersArray.substring(idx, end + 1);
                String uEmail = extractJsonString(user, "email", "").trim().toLowerCase();
                String uPass = extractJsonString(user, "password", "").trim();
                if (uEmail.equalsIgnoreCase(email) && uPass.equals(password)) {
                    return user;
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static synchronized String findUserByUsername(String username) {
        if (username == null || username.trim().isEmpty() || globalState == null) return null;
        try {
            int usersIdx = globalState.indexOf("\"users\":");
            if (usersIdx == -1) return null;
            int startBracket = globalState.indexOf("[", usersIdx);
            if (startBracket == -1) return null;
            int bracketCount = 1;
            int endBracket = -1;
            for (int i = startBracket + 1; i < globalState.length(); i++) {
                char c = globalState.charAt(i);
                if (c == '[') bracketCount++;
                else if (c == ']') {
                    bracketCount--;
                    if (bracketCount == 0) {
                        endBracket = i;
                        break;
                    }
                }
            }
            if (endBracket == -1) return null;
            String usersArray = globalState.substring(startBracket + 1, endBracket);
            int idx = 0;
            String target = username.trim().toLowerCase();
            while ((idx = usersArray.indexOf("{", idx)) != -1) {
                int end = usersArray.indexOf("}", idx);
                if (end == -1) break;
                String user = usersArray.substring(idx, end + 1);
                String uName = extractJsonString(user, "username", "").trim().toLowerCase();
                String dName = extractJsonString(user, "display_name", "").trim().toLowerCase().replace(" ", "");
                String rName = extractJsonString(user, "name", "").trim().toLowerCase().replace(" ", "");
                if (uName.equals(target) || dName.equals(target) || rName.equals(target)) {
                    return user;
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static synchronized String findUserById(String targetId) {
        if (targetId == null || targetId.isEmpty() || globalState == null) return null;
        try {
            int usersIdx = globalState.indexOf("\"users\":");
            if (usersIdx == -1) return null;
            int startBracket = globalState.indexOf("[", usersIdx);
            if (startBracket == -1) return null;
            int bracketCount = 1;
            int endBracket = -1;
            for (int i = startBracket + 1; i < globalState.length(); i++) {
                char c = globalState.charAt(i);
                if (c == '[') bracketCount++;
                else if (c == ']') {
                    bracketCount--;
                    if (bracketCount == 0) {
                        endBracket = i;
                        break;
                    }
                }
            }
            if (endBracket == -1) return null;
            String usersArray = globalState.substring(startBracket + 1, endBracket);
            int idx = 0;
            while ((idx = usersArray.indexOf("{", idx)) != -1) {
                int end = usersArray.indexOf("}", idx);
                if (end == -1) break;
                String user = usersArray.substring(idx, end + 1);
                String uId = extractJsonString(user, "id", extractJsonString(user, "uid", ""));
                if (uId.equals(targetId)) {
                    return user;
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return null;
    }

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            if ("HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(200, -1);
                exchange.close();
                return;
            }
            String response = "{\"status\":\"healthy\",\"platform\":\"Online Recipe Sharing Platform\",\"developer\":\"Sachin Bhandari\",\"port\":" + port + "}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            String method = exchange.getRequestMethod();
            String query = exchange.getRequestURI().getQuery();

            if ("DELETE".equalsIgnoreCase(method) || (query != null && query.contains("deleteId="))) {
                String deleteId = "";
                if (query != null && query.contains("deleteId=")) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("deleteId=")) {
                            deleteId = part.substring("deleteId=".length());
                        }
                    }
                }
                if (deleteId != null && !deleteId.isEmpty()) {
                    removeRecipeFromGlobalState(deleteId);
                }
                String response = "{\"success\":true,\"message\":\"Deleted " + deleteId + "\"}";
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
                return;
            }

            if ("POST".equalsIgnoreCase(method)) {
                String body = "";
                try (InputStream is = exchange.getRequestBody();
                     ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[1024];
                    int read;
                    while ((read = is.read(buffer)) != -1) {
                        baos.write(buffer, 0, read);
                    }
                    body = baos.toString(StandardCharsets.UTF_8);
                }
                if (body != null && body.length() > 5) {
                    savePersistedState(body);
                }
                String response = "{\"success\":true,\"message\":\"State synchronized\"}";
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                byte[] bytes = globalState.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            }
        }
    }

    static class UploadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            try {
                String reqContentType = exchange.getRequestHeaders().getFirst("Content-Type");
                if (reqContentType == null) reqContentType = "";
                String query = exchange.getRequestURI().getQuery();
                boolean isVideo = reqContentType.toLowerCase().contains("video") ||
                                  (query != null && query.toLowerCase().contains("type=video"));

                File uploadsDir = new File("uploads");
                if (!uploadsDir.exists()) {
                    uploadsDir.mkdirs();
                }

                if (isVideo || reqContentType.toLowerCase().contains("octet-stream")) {
                    String extension = ".mp4";
                    if (reqContentType.toLowerCase().contains("webm") || (query != null && query.toLowerCase().contains("webm"))) {
                        extension = ".webm";
                    } else if (reqContentType.toLowerCase().contains("quicktime") || (query != null && query.toLowerCase().contains("mov"))) {
                        extension = ".mov";
                    }

                    String filename = "video_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000) + extension;
                    File targetFile = new File(uploadsDir, filename);

                    try (InputStream is = exchange.getRequestBody();
                         OutputStream fos = new java.io.FileOutputStream(targetFile)) {
                        byte[] buffer = new byte[65536];
                        int read;
                        while ((read = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, read);
                        }
                    }

                    String fileUrl = "/uploads/" + filename;
                    String jsonResponse = "{\"success\":true,\"url\":\"" + fileUrl + "\",\"filename\":\"" + filename + "\",\"type\":\"video\"}";
                    sendJsonResponse(exchange, 200, jsonResponse);
                    return;
                }

                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    baos.write(buffer, 0, read);
                }
                String rawBody = baos.toString(StandardCharsets.UTF_8).trim();

                String base64Data = "";
                String extension = ".jpg";

                if (rawBody.startsWith("{") && rawBody.contains("\"image\"")) {
                    int keyIdx = rawBody.indexOf("\"image\"");
                    int colonIdx = rawBody.indexOf(":", keyIdx);
                    int quoteStart = rawBody.indexOf("\"", colonIdx);
                    int quoteEnd = -1;
                    if (quoteStart != -1) {
                        for (int i = quoteStart + 1; i < rawBody.length(); i++) {
                            char c = rawBody.charAt(i);
                            if (c == '\\') {
                                i++;
                            } else if (c == '"') {
                                quoteEnd = i;
                                break;
                            }
                        }
                        if (quoteEnd != -1) {
                            base64Data = rawBody.substring(quoteStart + 1, quoteEnd);
                        }
                    }
                } else {
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
                byte[] imageBytes = java.util.Base64.getMimeDecoder().decode(base64Data);

                if (imageBytes == null || imageBytes.length == 0) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"Uploaded image data is empty or invalid\"}");
                    return;
                }

                String filename = (extension.equals(".mp4") || extension.equals(".webm") ? "video_" : "dish_") + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000) + extension;
                File targetFile = new File(uploadsDir, filename);
                Files.write(targetFile.toPath(), imageBytes);

                String fileUrl = "/uploads/" + filename;
                String jsonResponse = "{\"success\":true,\"url\":\"" + fileUrl + "\",\"filename\":\"" + filename + "\"}";
                sendJsonResponse(exchange, 200, jsonResponse);
            } catch (Exception e) {
                String errResponse = "{\"error\":\"Upload failed: " + e.getMessage() + "\"}";
                sendJsonResponse(exchange, 400, errResponse);
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            File file = new File("." + path).getCanonicalFile();
            File currentDir = new File(".").getCanonicalFile();

            if (!file.getPath().startsWith(currentDir.getPath()) || !file.exists() || file.isDirectory()) {
                File indexFile = new File("index.html");
                if (indexFile.exists()) {
                    file = indexFile;
                } else {
                    String notFound = "404 Not Found";
                    exchange.sendResponseHeaders(404, notFound.length());
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(notFound.getBytes());
                    }
                    return;
                }
            }

            String contentType = determineContentType(file.getName());
            long fileLength = file.length();

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Accept-Ranges", "bytes");

            String nameLower = file.getName().toLowerCase();
            if (nameLower.endsWith(".html") || nameLower.endsWith(".js") || nameLower.endsWith(".css") || nameLower.endsWith(".json")) {
                exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate");
                exchange.getResponseHeaders().set("Pragma", "no-cache");
                exchange.getResponseHeaders().set("Expires", "0");
            }

            if ("HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.getResponseHeaders().set("Content-Length", String.valueOf(fileLength));
                exchange.sendResponseHeaders(200, -1);
                exchange.close();
                return;
            }

            String rangeHeader = exchange.getRequestHeaders().getFirst("Range");
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String rangeVal = rangeHeader.substring("bytes=".length()).trim();
                long start = 0;
                long end = fileLength - 1;

                if (rangeVal.contains("-")) {
                    String[] parts = rangeVal.split("-", 2);
                    if (!parts[0].isEmpty()) {
                        try { start = Long.parseLong(parts[0].trim()); } catch (NumberFormatException ignored) {}
                    }
                    if (parts.length > 1 && !parts[1].isEmpty()) {
                        try { end = Long.parseLong(parts[1].trim()); } catch (NumberFormatException ignored) {}
                    }
                }

                if (start > end || start >= fileLength) {
                    exchange.getResponseHeaders().set("Content-Range", "bytes *" + "/" + fileLength);
                    exchange.sendResponseHeaders(416, -1);
                    exchange.close();
                    return;
                }

                if (end >= fileLength) end = fileLength - 1;
                long contentLength = end - start + 1;

                exchange.getResponseHeaders().set("Content-Range", "bytes " + start + "-" + end + "/" + fileLength);
                exchange.getResponseHeaders().set("Content-Length", String.valueOf(contentLength));
                exchange.sendResponseHeaders(206, contentLength);

                try (java.io.RandomAccessFile raf = new java.io.RandomAccessFile(file, "r");
                     OutputStream os = exchange.getResponseBody()) {
                    raf.seek(start);
                    byte[] buffer = new byte[65536];
                    long remaining = contentLength;
                    while (remaining > 0) {
                        int toRead = (int) Math.min(buffer.length, remaining);
                        int read = raf.read(buffer, 0, toRead);
                        if (read == -1) break;
                        os.write(buffer, 0, read);
                        remaining -= read;
                    }
                }
                return;
            }

            exchange.getResponseHeaders().set("Content-Length", String.valueOf(fileLength));
            exchange.sendResponseHeaders(200, fileLength);
            try (InputStream fis = new FileInputStream(file);
                 OutputStream os = exchange.getResponseBody()) {
                byte[] buffer = new byte[65536];
                int read;
                while ((read = fis.read(buffer)) != -1) {
                    os.write(buffer, 0, read);
                }
            }
        }
    }

    private static void sendCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
        exchange.getResponseHeaders().set("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
        exchange.sendResponseHeaders(204, -1);
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        exchange.getResponseHeaders().set("Pragma", "no-cache");
        exchange.getResponseHeaders().set("Expires", "0");
        if ("HEAD".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(statusCode, -1);
            exchange.close();
            return;
        }
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String determineContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=UTF-8";
        if (lower.endsWith(".css")) return "text/css; charset=UTF-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=UTF-8";
        if (lower.endsWith(".json")) return "application/json; charset=UTF-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".mov")) return "video/quicktime";
        if (lower.endsWith(".m4v")) return "video/x-m4v";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    static class FeedHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            try {
                purgeExpiredEphemeralPosts();
                String enrichedPosts = getEnrichedStories();
                String annJson = getAnnouncementJson();
                String response = "{\"success\":true,\"posts\":" + enrichedPosts + ",\"announcement\":" + annJson + "}";
                sendJsonResponse(exchange, 200, response);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class PostsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if ("DELETE".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = is.read(buf)) != -1) {
                        baos.write(buf, 0, read);
                    }
                    String body = baos.toString(StandardCharsets.UTF_8).trim();
                    String postId = extractJsonString(body, "postId", "");
                    String userId = extractJsonString(body, "userId", "");
                    if (postId.isEmpty() || userId.isEmpty()) {
                        sendJsonResponse(exchange, 400, "{\"error\":\"postId and userId required\"}");
                        return;
                    }
                    boolean deleted = deleteStory(postId, userId);
                    if (deleted) {
                        sendJsonResponse(exchange, 200, "{\"success\":true,\"deleted\":true}");
                    } else {
                        sendJsonResponse(exchange, 404, "{\"success\":false,\"error\":\"Post not found or not owned by user\"}");
                    }
                } catch (Exception e) {
                    sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int read;
                while ((read = is.read(buf)) != -1) {
                    baos.write(buf, 0, read);
                }
                String body = baos.toString(StandardCharsets.UTF_8).trim();

                long now = System.currentTimeMillis();
                long expiresAt = now + 86400000L;

                String userId = extractJsonString(body, "userId", "usr-1");
                String username = extractJsonString(body, "username", "Sachin Bhandari");
                String avatar = extractJsonString(body, "userAvatar", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80");
                String mediaUrl = extractJsonString(body, "mediaUrl", "");
                String mediaPath = extractJsonString(body, "mediaPath", "");
                String mediaType = extractJsonString(body, "mediaType", "image");
                String caption = extractJsonString(body, "caption", "");
                double duration = extractJsonDouble(body, "duration", 0.0);

                if ("video".equalsIgnoreCase(mediaType) && duration > 10.05) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"Video duration must not exceed 10 seconds\"}");
                    return;
                }

                int streak = updateStreak(userId, now);

                String postId = "post_" + now + "_" + (int)(Math.random() * 1000);
                String newPostJson = "{\"id\":\"" + postId + "\",\"userId\":\"" + userId + "\",\"username\":\"" + escapeJson(username) + "\",\"userAvatar\":\"" + avatar + "\",\"mediaUrl\":\"" + mediaUrl + "\",\"mediaPath\":\"" + mediaPath + "\",\"mediaType\":\"" + mediaType + "\",\"caption\":\"" + escapeJson(caption) + "\",\"duration\":" + duration + ",\"createdAt\":" + now + ",\"expiresAt\":" + expiresAt + "}";

                saveStory(newPostJson);
                notifyFollowersOfNewPost(userId, username, avatar, postId, now);

                String resp = "{\"success\":true,\"post\":" + newPostJson + ",\"currentStreak\":" + streak + ",\"hoursRemaining\":24.0}";
                sendJsonResponse(exchange, 201, resp);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class ProfileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            try {
                String query = exchange.getRequestURI().getQuery();
                String targetUid = "usr-1";
                if (query != null && query.contains("userId=")) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("userId=")) {
                            targetUid = part.substring("userId=".length()).trim();
                        }
                    }
                }

                long now = System.currentTimeMillis();
                long lastUpload = getLastUploadTime(targetUid);
                int totalStreak = getStreakCount(targetUid);
                long diff = now - lastUpload;

                int activeStreak = (lastUpload > 0 && diff <= 48 * 3600000L) ? totalStreak : 0;
                double hoursRemaining = (lastUpload > 0 && diff <= 48 * 3600000L) ? ((48 * 3600000L - diff) / 3600000.0) : 0.0;
                hoursRemaining = Math.round(hoursRemaining * 10.0) / 10.0;

                String activePosts = getActiveUserStories(targetUid, now);

                String username = "Sachin Bhandari";
                String email = "sachin.bhandari@recipes.com";
                String avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

                String userJson = findUserById(targetUid);
                if (userJson != null) {
                    username = extractJsonString(userJson, "name", extractJsonString(userJson, "display_name", extractJsonString(userJson, "username", username)));
                    email = extractJsonString(userJson, "email", email);
                    avatarUrl = extractJsonString(userJson, "avatar", extractJsonString(userJson, "avatar_url", avatarUrl));
                }

                String resp = "{\"success\":true,\"user\":{\"id\":\"" + targetUid + "\",\"username\":\"" + escapeJson(username) + "\",\"email\":\"" + escapeJson(email) + "\",\"avatarUrl\":\"" + avatarUrl + "\",\"streak\":" + activeStreak + ",\"hoursRemaining\":" + hoursRemaining + "},\"activePosts\":" + activePosts + "}";
                sendJsonResponse(exchange, 200, resp);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class AuthSignupHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int read;
                while ((read = is.read(buf)) != -1) {
                    baos.write(buf, 0, read);
                }
                String body = baos.toString(StandardCharsets.UTF_8).trim();

                String email = extractJsonString(body, "email", "").trim().toLowerCase();
                String password = extractJsonString(body, "password", "").trim();
                String fullName = extractJsonString(body, "fullName", "").trim();
                String username = extractJsonString(body, "username", "").trim().toLowerCase();

                if (email.isEmpty() || password.isEmpty() || fullName.isEmpty() || username.isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"All fields are required\"}");
                    return;
                }

                if (findUserByEmail(email) != null) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Email address already registered\"}");
                    return;
                }

                String userId = "usr-" + System.currentTimeMillis();
                String avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

                String newUserJson = "{\"uid\":\"" + userId + "\",\"id\":\"" + userId + "\",\"email\":\"" + escapeJson(email) + "\",\"name\":\"" + escapeJson(fullName) + "\",\"display_name\":\"" + escapeJson(fullName) + "\",\"username\":\"" + escapeJson(username) + "\",\"password\":\"" + escapeJson(password) + "\",\"avatar\":\"" + avatar + "\",\"avatar_url\":\"" + avatar + "\",\"role\":\"user\",\"streak\":0,\"created_at\":\"" + System.currentTimeMillis() + "\"}";

                saveUserToState(newUserJson);

                String token = "fb_tok_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
                String resp = "{\"success\":true,\"token\":\"" + token + "\",\"user\":{\"id\":\"" + userId + "\",\"email\":\"" + escapeJson(email) + "\",\"name\":\"" + escapeJson(fullName) + "\",\"username\":\"" + escapeJson(username) + "\",\"avatar\":\"" + avatar + "\",\"streak\":0}}";
                sendJsonResponse(exchange, 201, resp);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"success\":false,\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class AuthLoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }
            try {
                InputStream is = exchange.getRequestBody();
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int read;
                while ((read = is.read(buf)) != -1) {
                    baos.write(buf, 0, read);
                }
                String body = baos.toString(StandardCharsets.UTF_8).trim();

                String username = extractJsonString(body, "username", "").trim().toLowerCase();
                String email = extractJsonString(body, "email", "").trim().toLowerCase();
                String password = extractJsonString(body, "password", "").trim();

                if (username.isEmpty() && email.isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Username is required\"}");
                    return;
                }

                String userJson = null;
                if (!username.isEmpty()) {
                    userJson = findUserByUsername(username);
                    if (userJson == null) {
                        String userId = "usr-" + System.currentTimeMillis();
                        String avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";
                        String newUserJson = "{\"uid\":\"" + userId + "\",\"id\":\"" + userId + "\",\"email\":\"" + escapeJson(username) + "@foodbite.app\",\"name\":\"" + escapeJson(username) + "\",\"display_name\":\"" + escapeJson(username) + "\",\"username\":\"" + escapeJson(username) + "\",\"password\":\"\",\"avatar\":\"" + avatar + "\",\"avatar_url\":\"" + avatar + "\",\"role\":\"user\",\"streak\":0,\"created_at\":\"" + System.currentTimeMillis() + "\"}";
                        saveUserToState(newUserJson);
                        userJson = newUserJson;
                    }
                } else {
                    userJson = findUserByCredentials(email, password);
                }

                if (userJson == null) {
                    sendJsonResponse(exchange, 401, "{\"success\":false,\"message\":\"Invalid credentials\"}");
                    return;
                }

                String userId = extractJsonString(userJson, "id", extractJsonString(userJson, "uid", "usr-1"));
                String name = extractJsonString(userJson, "name", extractJsonString(userJson, "display_name", "FoodBite User"));
                String uname = extractJsonString(userJson, "username", name.toLowerCase().replace(" ", ""));
                String uemail = extractJsonString(userJson, "email", uname + "@foodbite.app");
                String avatar = extractJsonString(userJson, "avatar", extractJsonString(userJson, "avatar_url", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"));

                int streak = getStreakCount(userId);
                String token = "fb_tok_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
                String resp = "{\"success\":true,\"token\":\"" + token + "\",\"user\":{\"id\":\"" + userId + "\",\"email\":\"" + escapeJson(uemail) + "\",\"name\":\"" + escapeJson(name) + "\",\"username\":\"" + escapeJson(uname) + "\",\"avatar\":\"" + avatar + "\",\"streak\":" + streak + "}}";
                sendJsonResponse(exchange, 200, resp);
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"success\":false,\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class FollowHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String userId = "usr-1";
                if (query != null && query.contains("userId=")) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("userId=")) {
                            userId = part.substring("userId=".length()).trim();
                        }
                    }
                }
                List<String> following = getFollowingOf(userId);
                List<String> followers = getFollowersOf(userId);
                StringBuilder folJson = new StringBuilder("[");
                for (int i = 0; i < following.size(); i++) {
                    if (i > 0) folJson.append(",");
                    folJson.append("\"").append(following.get(i)).append("\"");
                }
                folJson.append("]");

                StringBuilder ferJson = new StringBuilder("[");
                for (int i = 0; i < followers.size(); i++) {
                    if (i > 0) ferJson.append(",");
                    ferJson.append("\"").append(followers.get(i)).append("\"");
                }
                ferJson.append("]");

                String resp = "{\"success\":true,\"following\":" + folJson + ",\"followers\":" + ferJson + "}";
                sendJsonResponse(exchange, 200, resp);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = is.read(buf)) != -1) {
                        baos.write(buf, 0, read);
                    }
                    String body = baos.toString(StandardCharsets.UTF_8).trim();

                    String followerId = extractJsonString(body, "followerId", "").trim();
                    String followingId = extractJsonString(body, "followingId", "").trim();
                    String action = extractJsonString(body, "action", "toggle").trim();

                    if (followerId.isEmpty() || followingId.isEmpty() || followerId.equals(followingId)) {
                        sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Invalid follower or target id\"}");
                        return;
                    }

                    boolean nowFollowing = toggleFollow(followerId, followingId, action);
                    int count = getFollowersOf(followingId).size();
                    String resp = "{\"success\":true,\"isFollowing\":" + nowFollowing + ",\"followerCount\":" + count + "}";
                    sendJsonResponse(exchange, 200, resp);
                } catch (Exception e) {
                    sendJsonResponse(exchange, 500, "{\"success\":false,\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
                return;
            }

            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class NotificationsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }

            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            String query = exchange.getRequestURI().getQuery();
            String userId = "usr-1";
            if (query != null && query.contains("userId=")) {
                for (String part : query.split("&")) {
                    if (part.startsWith("userId=")) {
                        userId = part.substring("userId=".length()).trim();
                    }
                }
            }

            String notifs = getNotificationsForUser(userId);
            String resp = "{\"success\":true,\"notifications\":" + notifs + "}";
            sendJsonResponse(exchange, 200, resp);
        }
    }

    static class LikesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String postId = "";
                if (query != null && query.contains("postId=")) {
                    for (String param : query.split("&")) {
                        if (param.startsWith("postId=")) {
                            postId = param.substring(7);
                            break;
                        }
                    }
                }
                String resp = getLikesForPost(postId);
                sendJsonResponse(exchange, 200, resp);
                return;
            }
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = is.read(buf)) != -1) {
                        baos.write(buf, 0, read);
                    }
                    String body = baos.toString(StandardCharsets.UTF_8).trim();
                    String postId = extractJsonString(body, "postId", "");
                    String userId = extractJsonString(body, "userId", "");
                    String username = extractJsonString(body, "username", "");
                    String userAvatar = extractJsonString(body, "userAvatar", "");
                    String resp = toggleLikeRecord(postId, userId, username, userAvatar);
                    sendJsonResponse(exchange, 200, resp);
                } catch (Exception e) {
                    sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class CommentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String postId = "";
                if (query != null && query.contains("postId=")) {
                    for (String param : query.split("&")) {
                        if (param.startsWith("postId=")) {
                            postId = param.substring(7);
                            break;
                        }
                    }
                }
                java.util.Map<String, List<String>> map = getCommentsGroupedByPost();
                List<String> list = map.getOrDefault(postId, new ArrayList<>());
                String resp = "{\"success\":true,\"comments\":[" + String.join(",", list) + "]}";
                sendJsonResponse(exchange, 200, resp);
                return;
            }
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = is.read(buf)) != -1) {
                        baos.write(buf, 0, read);
                    }
                    String body = baos.toString(StandardCharsets.UTF_8).trim();
                    String postId = extractJsonString(body, "postId", "");
                    String userId = extractJsonString(body, "userId", "");
                    String username = extractJsonString(body, "username", "");
                    String userAvatar = extractJsonString(body, "userAvatar", "");
                    String text = extractJsonString(body, "text", "");
                    String resp = addCommentRecord(postId, userId, username, userAvatar, text);
                    sendJsonResponse(exchange, 201, resp);
                } catch (Exception e) {
                    sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    static class AnnouncementHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                return;
            }
            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String ann = getAnnouncementJson();
                sendJsonResponse(exchange, 200, "{\"success\":true,\"announcement\":" + ann + "}");
                return;
            }
            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    InputStream is = exchange.getRequestBody();
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = is.read(buf)) != -1) {
                        baos.write(buf, 0, read);
                    }
                    String body = baos.toString(StandardCharsets.UTF_8).trim();
                    boolean enabled = true;
                    if (body.contains("\"enabled\":false") || body.contains("\"enabled\": false")) {
                        enabled = false;
                    }
                    String title = extractJsonString(body, "title", "Site Maintenance Notice");
                    String message = extractJsonString(body, "message", "");
                    String type = extractJsonString(body, "type", "maintenance");
                    long now = System.currentTimeMillis();
                    String json = "{\"enabled\":" + enabled + ",\"title\":\"" + escapeJson(title) + "\",\"message\":\"" + escapeJson(message) + "\",\"type\":\"" + escapeJson(type) + "\",\"updatedAt\":" + now + ",\"updatedBy\":\"Sachin Bhandari (Admin)\"}";
                    File dataDir = new File("data");
                    if (!dataDir.exists()) dataDir.mkdirs();
                    Files.write(new File("data/announcement.json").toPath(), json.getBytes(StandardCharsets.UTF_8));
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"announcement\":" + json + "}");
                } catch (Exception e) {
                    sendJsonResponse(exchange, 500, "{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
                }
                return;
            }
            sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
        }
    }

    private static synchronized String getAnnouncementJson() {
        File annFile = new File("data/announcement.json");
        if (annFile.exists()) {
            try {
                return new String(Files.readAllBytes(annFile.toPath()), StandardCharsets.UTF_8).trim();
            } catch (Exception ignored) {}
        }
        return "{\"enabled\":false,\"title\":\"\",\"message\":\"\",\"type\":\"maintenance\",\"updatedAt\":" + System.currentTimeMillis() + "}";
    }


    private static final String LIKES_FILE = "data/likes.json";
    private static final String COMMENTS_FILE = "data/comments.json";

    private static synchronized String getEnrichedStories() {
        try {
            File file = new File("data/stories.json");
            if (!file.exists()) return "[]";
            byte[] bytes = Files.readAllBytes(file.toPath());
            String data = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!data.startsWith("[")) return "[]";

            java.util.Map<String, List<String>> likesMap = getLikesGroupedByPost();
            java.util.Map<String, List<String>> commentsMap = getCommentsGroupedByPost();

            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            int idx = 0;
            while ((idx = data.indexOf("{", idx)) != -1) {
                int end = data.indexOf("}", idx);
                if (end == -1) break;
                String postJson = data.substring(idx, end + 1);
                String postId = extractJsonString(postJson, "id", "");

                List<String> postLikes = likesMap.getOrDefault(postId, new ArrayList<>());
                String likesArrayStr = "[" + String.join(",", postLikes) + "]";
                int likeCount = postLikes.size();

                List<String> postComments = commentsMap.getOrDefault(postId, new ArrayList<>());
                String commentsArrayStr = "[" + String.join(",", postComments) + "]";
                int commentCount = postComments.size();

                String enrichedPost = postJson.substring(0, postJson.length() - 1)
                    + ",\"likes\":" + likesArrayStr
                    + ",\"likeCount\":" + likeCount
                    + ",\"comments\":" + commentsArrayStr
                    + ",\"commentCount\":" + commentCount
                    + "}";

                if (!first) sb.append(",");
                sb.append(enrichedPost);
                first = false;
                idx = end + 1;
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    private static synchronized java.util.Map<String, List<String>> getLikesGroupedByPost() {
        java.util.Map<String, List<String>> map = new java.util.HashMap<>();
        try {
            File f = new File(LIKES_FILE);
            if (!f.exists()) return map;
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return map;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String postId = extractJsonString(obj, "postId", "");
                if (!postId.isEmpty()) {
                    map.computeIfAbsent(postId, k -> new ArrayList<>()).add(obj);
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return map;
    }

    private static synchronized java.util.Map<String, List<String>> getCommentsGroupedByPost() {
        java.util.Map<String, List<String>> map = new java.util.HashMap<>();
        try {
            File f = new File(COMMENTS_FILE);
            if (!f.exists()) return map;
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return map;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String postId = extractJsonString(obj, "postId", "");
                if (!postId.isEmpty()) {
                    map.computeIfAbsent(postId, k -> new ArrayList<>()).add(obj);
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return map;
    }

    private static synchronized String toggleLikeRecord(String postId, String userId, String username, String userAvatar) {
        if (postId == null || postId.isEmpty() || userId == null || userId.isEmpty()) {
            return "{\"success\":false,\"error\":\"postId and userId required\"}";
        }
        try {
            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(LIKES_FILE);
            String s = "[]";
            if (f.exists()) {
                byte[] bytes = Files.readAllBytes(f.toPath());
                s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (!s.startsWith("[")) s = "[]";
            }
            List<String> allLikes = new ArrayList<>();
            List<String> thisPostLikes = new ArrayList<>();
            boolean alreadyLiked = false;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String pId = extractJsonString(obj, "postId", "");
                String uId = extractJsonString(obj, "userId", "");
                String uName = extractJsonString(obj, "username", "");
                if (pId.equals(postId)) {
                    if (uId.equals(userId) || (!uName.isEmpty() && uName.equalsIgnoreCase(username))) {
                        alreadyLiked = true;
                    } else {
                        allLikes.add(obj);
                        thisPostLikes.add(obj);
                    }
                } else {
                    allLikes.add(obj);
                }
                idx = end + 1;
            }

            boolean isNowLiked = !alreadyLiked;
            if (isNowLiked) {
                long now = System.currentTimeMillis();
                String newLike = "{\"postId\":\"" + escapeJson(postId) + "\",\"userId\":\"" + escapeJson(userId) + "\",\"username\":\"" + escapeJson(username) + "\",\"userAvatar\":\"" + escapeJson(userAvatar) + "\",\"likedAt\":" + now + "}";
                allLikes.add(newLike);
                thisPostLikes.add(newLike);

                String postOwner = getStoryOwner(postId);
                if (postOwner != null && !postOwner.isEmpty() && !postOwner.equals(userId)) {
                    String notifId = "notif_" + now + "_" + (int)(Math.random() * 10000);
                    String notif = "{\"id\":\"" + notifId + "\",\"recipientId\":\"" + escapeJson(postOwner) + "\",\"senderId\":\"" + escapeJson(userId) + "\",\"senderName\":\"" + escapeJson(username) + "\",\"senderAvatar\":\"" + escapeJson(userAvatar) + "\",\"postId\":\"" + escapeJson(postId) + "\",\"type\":\"like\",\"message\":\"@" + escapeJson(username) + " liked your daily food story! 🔥\",\"createdAt\":" + now + ",\"read\":false}";
                    appendNotification(notif);
                }
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < allLikes.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(allLikes.get(i));
            }
            sb.append("]");
            Files.write(f.toPath(), sb.toString().getBytes(StandardCharsets.UTF_8));

            String likesArrayStr = "[" + String.join(",", thisPostLikes) + "]";
            return "{\"success\":true,\"isLiked\":" + isNowLiked + ",\"likeCount\":" + thisPostLikes.size() + ",\"likes\":" + likesArrayStr + "}";
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}";
        }
    }

    private static synchronized String getStoryOwner(String postId) {
        if (postId == null || postId.isEmpty()) return null;
        try {
            File f = new File("data/stories.json");
            if (!f.exists()) return null;
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String pId = extractJsonString(obj, "id", "");
                if (pId.equals(postId)) {
                    return extractJsonString(obj, "userId", "");
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static synchronized String getLikesForPost(String postId) {
        if (postId == null || postId.isEmpty()) return "{\"success\":true,\"likes\":[],\"likeCount\":0}";
        try {
            File f = new File(LIKES_FILE);
            if (!f.exists()) return "{\"success\":true,\"likes\":[],\"likeCount\":0}";
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return "{\"success\":true,\"likes\":[],\"likeCount\":0}";
            List<String> list = new ArrayList<>();
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String pId = extractJsonString(obj, "postId", "");
                if (pId.equals(postId)) {
                    list.add(obj);
                }
                idx = end + 1;
            }
            return "{\"success\":true,\"postId\":\"" + escapeJson(postId) + "\",\"likeCount\":" + list.size() + ",\"likes\":[" + String.join(",", list) + "]}";
        } catch (Exception e) {
            return "{\"success\":true,\"likes\":[],\"likeCount\":0}";
        }
    }

    private static synchronized String addCommentRecord(String postId, String userId, String username, String userAvatar, String text) {
        if (postId == null || postId.isEmpty() || text == null || text.trim().isEmpty()) {
            return "{\"success\":false,\"error\":\"postId and text required\"}";
        }
        try {
            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(COMMENTS_FILE);
            String s = "[]";
            if (f.exists()) {
                byte[] bytes = Files.readAllBytes(f.toPath());
                s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (!s.startsWith("[")) s = "[]";
            }
            long now = System.currentTimeMillis();
            String cId = "cmt_" + now + "_" + (int)(Math.random() * 1000);
            String newCmt = "{\"id\":\"" + cId + "\",\"postId\":\"" + escapeJson(postId) + "\",\"userId\":\"" + escapeJson(userId) + "\",\"username\":\"" + escapeJson(username) + "\",\"userAvatar\":\"" + escapeJson(userAvatar) + "\",\"text\":\"" + escapeJson(text.trim()) + "\",\"createdAt\":" + now + "}";

            String updated;
            if (s.equals("[]") || s.isEmpty()) {
                updated = "[" + newCmt + "]";
            } else {
                updated = s.substring(0, s.length() - 1) + "," + newCmt + "]";
            }
            Files.write(f.toPath(), updated.getBytes(StandardCharsets.UTF_8));
            return "{\"success\":true,\"comment\":" + newCmt + "}";
        } catch (Exception e) {
            return "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}";
        }
    }

    private static synchronized void purgeLikesAndComments(String postId) {
        if (postId == null || postId.isEmpty()) return;
        try {
            File lf = new File(LIKES_FILE);
            if (lf.exists()) {
                byte[] bytes = Files.readAllBytes(lf.toPath());
                String s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (s.startsWith("[")) {
                    List<String> kept = new ArrayList<>();
                    int idx = 0;
                    while ((idx = s.indexOf("{", idx)) != -1) {
                        int end = s.indexOf("}", idx);
                        if (end == -1) break;
                        String obj = s.substring(idx, end + 1);
                        if (!postId.equals(extractJsonString(obj, "postId", ""))) {
                            kept.add(obj);
                        }
                        idx = end + 1;
                    }
                    Files.write(lf.toPath(), ("[" + String.join(",", kept) + "]").getBytes(StandardCharsets.UTF_8));
                }
            }
            File cf = new File(COMMENTS_FILE);
            if (cf.exists()) {
                byte[] bytes = Files.readAllBytes(cf.toPath());
                String s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (s.startsWith("[")) {
                    List<String> kept = new ArrayList<>();
                    int idx = 0;
                    while ((idx = s.indexOf("{", idx)) != -1) {
                        int end = s.indexOf("}", idx);
                        if (end == -1) break;
                        String obj = s.substring(idx, end + 1);
                        if (!postId.equals(extractJsonString(obj, "postId", ""))) {
                            kept.add(obj);
                        }
                        idx = end + 1;
                    }
                    Files.write(cf.toPath(), ("[" + String.join(",", kept) + "]").getBytes(StandardCharsets.UTF_8));
                }
            }
        } catch (Exception ignored) {}
    }

    private static synchronized void purgeExpiredEphemeralPosts() {
        try {
            File file = new File("data/stories.json");
            if (!file.exists()) return;
            byte[] bytes = Files.readAllBytes(file.toPath());
            String content = new String(bytes, StandardCharsets.UTF_8).trim();
            if (content.isEmpty() || !content.startsWith("[")) return;

            long now = System.currentTimeMillis();
            StringBuilder kept = new StringBuilder("[");
            boolean first = true;

            int idx = 0;
            while ((idx = content.indexOf("{", idx)) != -1) {
                int end = content.indexOf("}", idx);
                if (end == -1) break;
                String obj = content.substring(idx, end + 1);
                long expiresAt = 0;
                int expIdx = obj.indexOf("\"expiresAt\":");
                if (expIdx != -1) {
                    int numStart = expIdx + 12;
                    while (numStart < obj.length() && (obj.charAt(numStart) == ' ' || obj.charAt(numStart) == ':')) numStart++;
                    int numEnd = numStart;
                    while (numEnd < obj.length() && Character.isDigit(obj.charAt(numEnd))) numEnd++;
                    if (numEnd > numStart) {
                        try {
                            expiresAt = Long.parseLong(obj.substring(numStart, numEnd));
                        } catch (Exception ignored) {}
                    }
                }

                if (expiresAt > 0 && expiresAt <= now) {
                    int pathIdx = obj.indexOf("\"mediaPath\":");
                    if (pathIdx != -1) {
                        int q1 = obj.indexOf("\"", pathIdx + 12);
                        int q2 = obj.indexOf("\"", q1 + 1);
                        if (q1 != -1 && q2 != -1) {
                            String filePath = obj.substring(q1 + 1, q2);
                            if (!filePath.isEmpty()) {
                                File f = new File(filePath);
                                if (f.exists()) f.delete();
                            }
                        }
                    }
                } else {
                    if (!first) kept.append(",");
                    kept.append(obj);
                    first = false;
                }
                idx = end + 1;
            }
            kept.append("]");
            Files.write(file.toPath(), kept.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {}
    }

    private static synchronized void saveStory(String postJson) {
        try {
            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, "stories.json");
            String data = "[]";
            if (file.exists()) {
                byte[] bytes = Files.readAllBytes(file.toPath());
                data = new String(bytes, StandardCharsets.UTF_8).trim();
            }
            if (!data.startsWith("[")) data = "[]";
            String updated;
            if (data.equals("[]") || data.isEmpty()) {
                updated = "[" + postJson + "]";
            } else {
                updated = "[" + postJson + "," + data.substring(1);
            }
            Files.write(file.toPath(), updated.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {}
    }

    private static synchronized boolean deleteStory(String postId, String userId) {
        try {
            File file = new File("data/stories.json");
            if (!file.exists()) return false;
            byte[] bytes = Files.readAllBytes(file.toPath());
            String content = new String(bytes, StandardCharsets.UTF_8).trim();
            if (content.isEmpty() || !content.startsWith("[")) return false;

            StringBuilder kept = new StringBuilder("[");
            boolean first = true;
            boolean found = false;

            int idx = 0;
            while ((idx = content.indexOf("{", idx)) != -1) {
                int end = content.indexOf("}", idx);
                if (end == -1) break;
                String obj = content.substring(idx, end + 1);

                String pId = extractJsonString(obj, "id", "");
                String uId = extractJsonString(obj, "userId", "");

                if (pId.equals(postId) && (uId.equals(userId) || "usr-1".equals(userId))) {
                    found = true;
                    String mediaPath = extractJsonString(obj, "mediaPath", "");
                    if (!mediaPath.isEmpty()) {
                        File f = new File(mediaPath);
                        if (f.exists()) f.delete();
                    }
                } else {
                    if (!first) kept.append(",");
                    kept.append(obj);
                    first = false;
                }
                idx = end + 1;
            }
            kept.append("]");
            Files.write(file.toPath(), kept.toString().getBytes(StandardCharsets.UTF_8));
            if (found) {
                purgeLikesAndComments(postId);
            }
            return found;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static synchronized String readStreaksFile() {
        try {
            File file = new File("data/streaks.json");
            if (!file.exists()) return "{}";
            byte[] bytes = Files.readAllBytes(file.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            return (s.startsWith("{") && s.endsWith("}")) ? s : "{}";
        } catch (Exception ignored) {
            return "{}";
        }
    }

    private static synchronized int updateStreak(String userId, long now) {
        if (userId == null || userId.trim().isEmpty()) return 1;
        try {
            long last = getLastUploadTime(userId);
            int currentStreak = getStreakCount(userId);
            int newStreak = 1;

            if (last > 0) {
                long diff = now - last;
                if (diff < 12 * 3600000L) {
                    newStreak = Math.max(1, currentStreak);
                } else if (diff <= 48 * 3600000L) {
                    newStreak = currentStreak + 1;
                } else {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, "streaks.json");

            java.util.Map<String, String> userMap = new java.util.LinkedHashMap<>();
            String s = readStreaksFile();
            if (s.length() > 2) {
                int p = 1;
                while (p < s.length()) {
                    int kStart = s.indexOf("\"", p);
                    if (kStart == -1) break;
                    int kEnd = s.indexOf("\"", kStart + 1);
                    if (kEnd == -1) break;
                    String k = s.substring(kStart + 1, kEnd);
                    int bStart = s.indexOf("{", kEnd);
                    if (bStart == -1) break;
                    int bEnd = s.indexOf("}", bStart);
                    if (bEnd == -1) break;
                    userMap.put(k, s.substring(bStart, bEnd + 1));
                    p = bEnd + 1;
                }
            }

            userMap.put(userId, "{\"streakCount\":" + newStreak + ",\"lastUploadAt\":" + now + "}");

            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (java.util.Map.Entry<String, String> entry : userMap.entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(entry.getKey()).append("\":").append(entry.getValue());
                first = false;
            }
            sb.append("}");

            Files.write(file.toPath(), sb.toString().getBytes(StandardCharsets.UTF_8));
            return newStreak;
        } catch (Exception ignored) {
            return 1;
        }
    }

    private static synchronized long getLastUploadTime(String userId) {
        if (userId == null || userId.trim().isEmpty()) return 0;
        try {
            String s = readStreaksFile();
            String key = "\"" + userId + "\"";
            int uIdx = s.indexOf(key);
            if (uIdx == -1) return 0;
            int blockStart = s.indexOf("{", uIdx);
            if (blockStart == -1) return 0;
            int blockEnd = s.indexOf("}", blockStart);
            if (blockEnd == -1) return 0;
            String userBlock = s.substring(blockStart, blockEnd + 1);
            int idx = userBlock.indexOf("\"lastUploadAt\":");
            if (idx == -1) return 0;
            int numStart = idx + 15;
            while (numStart < userBlock.length() && (userBlock.charAt(numStart) == ' ' || userBlock.charAt(numStart) == ':')) numStart++;
            int numEnd = numStart;
            while (numEnd < userBlock.length() && Character.isDigit(userBlock.charAt(numEnd))) numEnd++;
            if (numEnd > numStart) {
                return Long.parseLong(userBlock.substring(numStart, numEnd));
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private static synchronized int getStreakCount(String userId) {
        if (userId == null || userId.trim().isEmpty()) return 0;
        try {
            String s = readStreaksFile();
            String key = "\"" + userId + "\"";
            int uIdx = s.indexOf(key);
            if (uIdx == -1) return 0;
            int blockStart = s.indexOf("{", uIdx);
            if (blockStart == -1) return 0;
            int blockEnd = s.indexOf("}", blockStart);
            if (blockEnd == -1) return 0;
            String userBlock = s.substring(blockStart, blockEnd + 1);
            int idx = userBlock.indexOf("\"streakCount\":");
            if (idx == -1) return 0;
            int numStart = idx + 14;
            while (numStart < userBlock.length() && (userBlock.charAt(numStart) == ' ' || numStart < userBlock.length() && userBlock.charAt(numStart) == ':')) numStart++;
            int numEnd = numStart;
            while (numEnd < userBlock.length() && Character.isDigit(userBlock.charAt(numEnd))) numEnd++;
            if (numEnd > numStart) {
                return Integer.parseInt(userBlock.substring(numStart, numEnd));
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private static synchronized String getActiveUserStories(String userId, long now) {
        try {
            File file = new File("data/stories.json");
            if (!file.exists()) return "[]";
            byte[] bytes = Files.readAllBytes(file.toPath());
            String content = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!content.startsWith("[")) return "[]";

            StringBuilder userPosts = new StringBuilder("[");
            boolean first = true;

            int idx = 0;
            while ((idx = content.indexOf("{", idx)) != -1) {
                int end = content.indexOf("}", idx);
                if (end == -1) break;
                String obj = content.substring(idx, end + 1);
                if (obj.contains("\"userId\":\"" + userId + "\"") || userId == null || userId.isEmpty()) {
                    if (!first) userPosts.append(",");
                    userPosts.append(obj);
                    first = false;
                }
                idx = end + 1;
            }
            userPosts.append("]");
            return userPosts.toString();
        } catch (Exception ignored) {
            return "[]";
        }
    }

    private static final String FOLLOWS_FILE = "data/follows.json";
    private static final String NOTIFS_FILE = "data/notifications.json";

    private static synchronized List<String> getFollowingOf(String userId) {
        List<String> list = new ArrayList<>();
        if (userId == null || userId.isEmpty()) return list;
        try {
            File f = new File(FOLLOWS_FILE);
            if (!f.exists()) return list;
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return list;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String follower = extractJsonString(obj, "followerId", "");
                String following = extractJsonString(obj, "followingId", "");
                if (follower.equals(userId) && !following.isEmpty() && !list.contains(following)) {
                    list.add(following);
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return list;
    }

    private static synchronized List<String> getFollowersOf(String userId) {
        List<String> list = new ArrayList<>();
        if (userId == null || userId.isEmpty()) return list;
        try {
            File f = new File(FOLLOWS_FILE);
            if (!f.exists()) return list;
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return list;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String follower = extractJsonString(obj, "followerId", "");
                String following = extractJsonString(obj, "followingId", "");
                if (following.equals(userId) && !follower.isEmpty() && !list.contains(follower)) {
                    list.add(follower);
                }
                idx = end + 1;
            }
        } catch (Exception ignored) {}
        return list;
    }

    private static synchronized boolean isFollowing(String followerId, String followingId) {
        if (followerId == null || followingId == null) return false;
        List<String> following = getFollowingOf(followerId);
        return following.contains(followingId);
    }

    private static synchronized boolean toggleFollow(String followerId, String followingId, String action) {
        if (followerId == null || followingId == null || followerId.equals(followingId)) return false;
        try {
            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(FOLLOWS_FILE);
            String s = "[]";
            if (f.exists()) {
                byte[] bytes = Files.readAllBytes(f.toPath());
                s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (!s.startsWith("[")) s = "[]";
            }
            List<String> records = new ArrayList<>();
            boolean exists = false;
            int idx = 0;
            while ((idx = s.indexOf("{", idx)) != -1) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String f1 = extractJsonString(obj, "followerId", "");
                String f2 = extractJsonString(obj, "followingId", "");
                if (f1.equals(followerId) && f2.equals(followingId)) {
                    exists = true;
                } else {
                    records.add(obj);
                }
                idx = end + 1;
            }

            boolean shouldFollow = false;
            if ("follow".equalsIgnoreCase(action)) {
                shouldFollow = true;
            } else if ("unfollow".equalsIgnoreCase(action)) {
                shouldFollow = false;
            } else {
                shouldFollow = !exists;
            }

            if (shouldFollow) {
                String newRecord = "{\"followerId\":\"" + escapeJson(followerId) + "\",\"followingId\":\"" + escapeJson(followingId) + "\",\"createdAt\":" + System.currentTimeMillis() + "}";
                records.add(newRecord);
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < records.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(records.get(i));
            }
            sb.append("]");
            Files.write(f.toPath(), sb.toString().getBytes(StandardCharsets.UTF_8));
            return shouldFollow;
        } catch (Exception ignored) {
            return false;
        }
    }

    private static synchronized void appendNotification(String notifJson) {
        try {
            File dir = new File("data");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(NOTIFS_FILE);
            String s = "[]";
            if (f.exists()) {
                byte[] bytes = Files.readAllBytes(f.toPath());
                s = new String(bytes, StandardCharsets.UTF_8).trim();
                if (!s.startsWith("[")) s = "[]";
            }
            String updated;
            if (s.equals("[]") || s.isEmpty()) {
                updated = "[" + notifJson + "]";
            } else {
                updated = "[" + notifJson + "," + s.substring(1);
            }
            Files.write(f.toPath(), updated.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ignored) {}
    }

    private static synchronized void notifyFollowersOfNewPost(String authorId, String authorName, String authorAvatar, String postId, long now) {
        try {
            List<String> followers = getFollowersOf(authorId);
            for (String followerId : followers) {
                if (followerId.equals(authorId)) continue;
                String notifId = "notif_" + now + "_" + (int)(Math.random() * 10000);
                String notifJson = "{\"id\":\"" + notifId + "\",\"recipientId\":\"" + escapeJson(followerId) + "\",\"senderId\":\"" + escapeJson(authorId) + "\",\"senderName\":\"" + escapeJson(authorName) + "\",\"senderAvatar\":\"" + escapeJson(authorAvatar) + "\",\"postId\":\"" + escapeJson(postId) + "\",\"type\":\"new_post\",\"message\":\"" + escapeJson(authorName) + " just posted a new daily food story.\",\"createdAt\":" + now + ",\"read\":false}";
                appendNotification(notifJson);
            }
        } catch (Exception ignored) {}
    }

    private static synchronized String getNotificationsForUser(String userId) {
        if (userId == null || userId.isEmpty()) return "[]";
        try {
            File f = new File(NOTIFS_FILE);
            if (!f.exists()) return "[]";
            byte[] bytes = Files.readAllBytes(f.toPath());
            String s = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!s.startsWith("[")) return "[]";
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            int idx = 0;
            int count = 0;
            while ((idx = s.indexOf("{", idx)) != -1 && count < 50) {
                int end = s.indexOf("}", idx);
                if (end == -1) break;
                String obj = s.substring(idx, end + 1);
                String recipient = extractJsonString(obj, "recipientId", "");
                if (recipient.equals(userId)) {
                    if (!first) sb.append(",");
                    sb.append(obj);
                    first = false;
                    count++;
                }
                idx = end + 1;
            }
            sb.append("]");
            return sb.toString();
        } catch (Exception ignored) {
            return "[]";
        }
    }

    private static String extractJsonString(String json, String key, String defaultVal) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx == -1) return defaultVal;
        int colon = json.indexOf(":", idx);
        if (colon == -1) return defaultVal;
        int q1 = json.indexOf("\"", colon);
        if (q1 == -1) return defaultVal;
        int q2 = json.indexOf("\"", q1 + 1);
        if (q2 == -1) return defaultVal;
        return json.substring(q1 + 1, q2);
    }

    private static double extractJsonDouble(String json, String key, double defaultVal) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx == -1) return defaultVal;
        int colon = json.indexOf(":", idx);
        if (colon == -1) return defaultVal;
        int start = colon + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.')) end++;
        if (end > start) {
            try {
                return Double.parseDouble(json.substring(start, end));
            } catch (Exception ignored) {}
        }
        return defaultVal;
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
