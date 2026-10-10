package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Like;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class LikeDaoJdbc implements LikeDao {

    @Override
    public List<Like> findByTargetId(String targetId) {
        List<Like> list = new ArrayList<>();
        String sql = "SELECT * FROM likes WHERE target_id = ? ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, targetId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Like l = new Like();
                    l.setId(rs.getInt("id"));
                    l.setTargetId(rs.getString("target_id"));
                    l.setUserId(rs.getString("user_id"));
                    l.setUsername(rs.getString("username"));
                    l.setUserAvatar(rs.getString("user_avatar"));
                    if (rs.getTimestamp("created_at") != null) {
                        l.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
                    }
                    list.add(l);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list likes for target: " + targetId, e);
        }
        return list;
    }

    @Override
    public boolean hasUserLiked(String targetId, String userId) {
        String sql = "SELECT 1 FROM likes WHERE target_id = ? AND user_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, targetId);
            ps.setString(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to check like status", e);
        }
    }

    @Override
    public boolean toggleLike(String targetId, String userId, String username, String userAvatar) {
        boolean currentlyLiked = hasUserLiked(targetId, userId);
        try (Connection conn = DatabaseConfig.getConnection()) {
            conn.setAutoCommit(false);
            try {
                if (currentlyLiked) {
                    try (PreparedStatement ps = conn.prepareStatement("DELETE FROM likes WHERE target_id = ? AND user_id = ?")) {
                        ps.setString(1, targetId);
                        ps.setString(2, userId);
                        ps.executeUpdate();
                    }
                } else {
                    try (PreparedStatement ps = conn.prepareStatement("INSERT INTO likes (target_id, user_id, username, user_avatar) VALUES (?, ?, ?, ?)")) {
                        ps.setString(1, targetId);
                        ps.setString(2, userId);
                        ps.setString(3, username);
                        ps.setString(4, userAvatar);
                        ps.executeUpdate();
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement("UPDATE recipes SET likes_count = (SELECT COUNT(*) FROM likes WHERE target_id = ?) WHERE id = ?")) {
                    ps.setString(1, targetId);
                    ps.setString(2, targetId);
                    ps.executeUpdate();
                }
                conn.commit();
                return !currentlyLiked;
            } catch (SQLException e) {
                conn.rollback();
                throw new DatabaseException("Failed to toggle like", e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Database error toggling like", e);
        }
    }

    @Override
    public int getLikeCount(String targetId) {
        String sql = "SELECT COUNT(*) as cnt FROM likes WHERE target_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, targetId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("cnt");
            }
        } catch (SQLException ignored) {}
        return 0;
    }
}
