package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Notification;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class NotificationDaoJdbc implements NotificationDao {

    @Override
    public List<Notification> findByUserId(String userId) {
        List<Notification> list = new ArrayList<>();
        String sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Notification n = new Notification();
                    n.setId(rs.getString("id"));
                    n.setUserId(rs.getString("user_id"));
                    n.setActorId(rs.getString("actor_id"));
                    n.setActorName(rs.getString("actor_name"));
                    n.setActorAvatar(rs.getString("actor_avatar"));
                    n.setType(rs.getString("type"));
                    n.setMessage(rs.getString("message"));
                    n.setTargetId(rs.getString("target_id"));
                    n.setRead(rs.getBoolean("is_read"));
                    if (rs.getTimestamp("created_at") != null) {
                        n.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
                    }
                    list.add(n);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list notifications for user: " + userId, e);
        }
        return list;
    }

    @Override
    public void save(Notification n) {
        String sql = "INSERT INTO notifications (id, user_id, actor_id, actor_name, actor_avatar, type, message, target_id, is_read) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, n.getId());
            ps.setString(2, n.getUserId());
            ps.setString(3, n.getActorId());
            ps.setString(4, n.getActorName());
            ps.setString(5, n.getActorAvatar());
            ps.setString(6, n.getType());
            ps.setString(7, n.getMessage());
            ps.setString(8, n.getTargetId());
            ps.setBoolean(9, n.isRead());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save notification", e);
        }
    }

    @Override
    public void markAsRead(String notificationId) {
        String sql = "UPDATE notifications SET is_read = TRUE WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, notificationId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to mark notification as read: " + notificationId, e);
        }
    }
}
