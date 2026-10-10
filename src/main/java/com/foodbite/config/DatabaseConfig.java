package com.foodbite.config;

import com.foodbite.exception.DatabaseException;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseConfig {
    private static volatile HikariDataSource dataSource;

    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/foodbite_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASS = "root123";
    private static final String DEFAULT_DRIVER = "com.mysql.cj.jdbc.Driver";

    private DatabaseConfig() {}

    public static synchronized void initialize() {
        if (dataSource != null && !dataSource.isClosed()) {
            return;
        }

        String jdbcUrl = System.getenv("DB_URL");
        if (jdbcUrl == null || jdbcUrl.trim().isEmpty()) {
            jdbcUrl = System.getenv("MYSQL_URL");
        }
        if (jdbcUrl == null || jdbcUrl.trim().isEmpty()) {
            jdbcUrl = System.getenv("JDBC_DATABASE_URL");
        }
        if (jdbcUrl == null || jdbcUrl.trim().isEmpty()) {
            jdbcUrl = DEFAULT_URL;
        }

        String username = System.getenv("DB_USER");
        if (username == null || username.trim().isEmpty()) {
            username = System.getenv("MYSQL_USER");
        }
        if (username == null || username.trim().isEmpty()) {
            username = DEFAULT_USER;
        }

        String password = System.getenv("DB_PASSWORD");
        if (password == null) {
            password = System.getenv("MYSQL_PASSWORD");
        }
        if (password == null) {
            password = DEFAULT_PASS;
        }

        String driver = System.getenv("DB_DRIVER");
        if (driver == null || driver.trim().isEmpty()) {
            driver = DEFAULT_DRIVER;
        }

        try {
            Class.forName(driver);
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName(driver);
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(5000);
            config.setPoolName("FoodBiteHikariPool");

            dataSource = new HikariDataSource(config);

            runMigrationScriptIfPresent("/schema.sql");
            runMigrationScriptIfPresent("/seed.sql");
        } catch (Exception e) {
            if (DEFAULT_URL.equals(jdbcUrl)) {
                System.out.println("Local MySQL unreachable, initializing embedded relational JDBC (H2 in MySQL mode)...");
                try {
                    Class.forName("org.h2.Driver");
                    HikariConfig h2Config = new HikariConfig();
                    h2Config.setJdbcUrl("jdbc:h2:./data/foodbite_db;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
                    h2Config.setUsername("sa");
                    h2Config.setPassword("");
                    h2Config.setDriverClassName("org.h2.Driver");
                    h2Config.setMaximumPoolSize(5);
                    h2Config.setPoolName("FoodBiteEmbeddedH2Pool");

                    dataSource = new HikariDataSource(h2Config);
                    runMigrationScriptIfPresent("/schema.sql");
                    runMigrationScriptIfPresent("/seed.sql");
                    System.out.println("Embedded relational JDBC database successfully initialized.");
                    return;
                } catch (Exception h2Ex) {
                    throw new DatabaseException("Failed to initialize database connection pool with URL: " + jdbcUrl, h2Ex);
                }
            }
            throw new DatabaseException("Failed to initialize database connection pool with URL: " + jdbcUrl, e);
        }
    }

    private static void runMigrationScriptIfPresent(String resourcePath) {
        try (InputStream is = DatabaseConfig.class.getResourceAsStream(resourcePath)) {
            if (is == null) return;
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.startsWith("--") || trimmed.isEmpty()) continue;
                sb.append(line).append("\n");
            }

            String[] sqlStatements = sb.toString().split(";");
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                for (String sql : sqlStatements) {
                    String clean = sql.trim();
                    if (!clean.isEmpty()) {
                        try {
                            stmt.execute(clean);
                        } catch (SQLException ignored) {
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }

    public static Connection getConnection() throws SQLException {
        if (dataSource == null || dataSource.isClosed()) {
            initialize();
        }
        return dataSource.getConnection();
    }

    public static synchronized void shutdown() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            dataSource = null;
        }
    }
}
