package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Announcement;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AnnouncementDaoJdbc implements AnnouncementDao {

    @Override
    public Announcement getAnnouncement() {
        String sql = "SELECT * FROM announcements ORDER BY id DESC LIMIT 1";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                Announcement a = new Announcement();
                a.setId(rs.getInt("id"));
                a.setEnabled(rs.getBoolean("enabled"));
                a.setTitle(rs.getString("title"));
                a.setMessage(rs.getString("message"));
                a.setType(rs.getString("type"));
                a.setUpdatedBy(rs.getString("updated_by"));
                a.setUpdatedAt(rs.getLong("updated_at"));
                return a;
            }
        } catch (SQLException ignored) {}
        return new Announcement(1, false, "Site Maintenance Notice", "Sorry, our site is under maintenance.", "maintenance", "Admin", System.currentTimeMillis());
    }

    @Override
    public void saveAnnouncement(Announcement a) {
        String sql = "INSERT INTO announcements (id, enabled, title, message, type, updated_by, updated_at) " +
                     "VALUES (1, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), title = VALUES(title), " +
                     "message = VALUES(message), type = VALUES(type), updated_by = VALUES(updated_by), updated_at = VALUES(updated_at)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBoolean(1, a.isEnabled());
            ps.setString(2, a.getTitle());
            ps.setString(3, a.getMessage());
            ps.setString(4, a.getType());
            ps.setString(5, a.getUpdatedBy());
            ps.setLong(6, a.getUpdatedAt() > 0 ? a.getUpdatedAt() : System.currentTimeMillis());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save announcement", e);
        }
    }
}
