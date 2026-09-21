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
            server.createContext("/", new StaticFileHandler());

            server.start();

            if (port != 8080) {
                try {
                    HttpServer server8080 = HttpServer.create(new InetSocketAddress("0.0.0.0", 8080), 0);
                    server8080.setExecutor(Executors.newFixedThreadPool(10));
                    server8080.createContext("/api/health", new HealthHandler());
                    server8080.createContext("/api/state", new StateHandler());
                    server8080.createContext("/api/upload", new UploadHandler());
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

                base64Data = base64Data.replaceAll("\\s+", "").replace("\\/", "/");
                byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);

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
}
