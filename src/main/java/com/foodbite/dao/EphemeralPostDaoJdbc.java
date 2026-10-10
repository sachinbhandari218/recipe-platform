package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.EphemeralPost;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EphemeralPostDaoJdbc implements EphemeralPostDao {

    private EphemeralPost mapRow(ResultSet rs) throws SQLException {
        EphemeralPost p = new EphemeralPost();
        p.setId(rs.getString("id"));
        p.setUserId(rs.getString("user_id"));
        p.setUsername(rs.getString("username"));
        p.setUserAvatar(rs.getString("user_avatar"));
        p.setMediaUrl(rs.getString("media_url"));
        p.setMediaPath(rs.getString("media_path"));
        p.setMediaType(rs.getString("media_type"));
        p.setMediaBase64(rs.getString("media_base64"));
        p.setCategory(rs.getString("category"));
        p.setCaption(rs.getString("caption"));
        p.setDuration(rs.getDouble("duration"));
        p.setCreatedAt(rs.getLong("created_at"));
        p.setExpiresAt(rs.getLong("expires_at"));
        return p;
    }

    @Override
    public List<EphemeralPost> findActive() {
        List<EphemeralPost> list = new ArrayList<>();
        long now = System.currentTimeMillis();
        String sql = "SELECT * FROM ephemeral_posts WHERE expires_at > ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, now);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list active ephemeral posts", e);
        }
        return list;
    }

    @Override
    public List<EphemeralPost> findActiveByUser(String userId) {
        List<EphemeralPost> list = new ArrayList<>();
        long now = System.currentTimeMillis();
        String sql = "SELECT * FROM ephemeral_posts WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            ps.setLong(2, now);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list active ephemeral posts for user: " + userId, e);
        }
        return list;
    }

    @Override
    public Optional<EphemeralPost> findById(String id) {
        String sql = "SELECT * FROM ephemeral_posts WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find post by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public void save(EphemeralPost post) {
        String sql = "INSERT INTO ephemeral_posts (id, user_id, username, user_avatar, media_url, media_path, media_type, " +
                     "media_base64, category, caption, duration, created_at, expires_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE caption = VALUES(caption)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, post.getId());
            ps.setString(2, post.getUserId());
            ps.setString(3, post.getUsername());
            ps.setString(4, post.getUserAvatar());
            ps.setString(5, post.getMediaUrl());
            ps.setString(6, post.getMediaPath());
            ps.setString(7, post.getMediaType());
            ps.setString(8, post.getMediaBase64() != null ? post.getMediaBase64() : "");
            ps.setString(9, post.getCategory());
            ps.setString(10, post.getCaption());
            ps.setDouble(11, post.getDuration());
            ps.setLong(12, post.getCreatedAt());
            ps.setLong(13, post.getExpiresAt());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save ephemeral post", e);
        }
    }

    @Override
    public boolean delete(String id, String userId) {
        String sql = "DELETE FROM ephemeral_posts WHERE id = ? AND (user_id = ? OR ? = 'usr-1' OR ? = 'admin')";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, userId);
            ps.setString(3, userId);
            ps.setString(4, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete ephemeral post: " + id, e);
        }
    }

    @Override
    public void purgeExpired() {
        long now = System.currentTimeMillis();
        String sql = "DELETE FROM ephemeral_posts WHERE expires_at <= ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, now);
            ps.executeUpdate();
        } catch (SQLException ignored) {}
    }
}
