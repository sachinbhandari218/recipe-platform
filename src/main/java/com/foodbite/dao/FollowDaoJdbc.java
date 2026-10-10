package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class FollowDaoJdbc implements FollowDao {

    @Override
    public List<String> getFollowingOf(String userId) {
        List<String> list = new ArrayList<>();
        String sql = "SELECT following_id FROM follows WHERE follower_id = ? ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(rs.getString("following_id"));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get following list", e);
        }
        return list;
    }

    @Override
    public List<String> getFollowersOf(String userId) {
        List<String> list = new ArrayList<>();
        String sql = "SELECT follower_id FROM follows WHERE following_id = ? ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(rs.getString("follower_id"));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to get followers list", e);
        }
        return list;
    }

    @Override
    public boolean isFollowing(String followerId, String followingId) {
        String sql = "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, followerId);
            ps.setString(2, followingId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to check follow status", e);
        }
    }

    @Override
    public boolean toggleFollow(String followerId, String followingId, String action) {
        boolean currentlyFollowing = isFollowing(followerId, followingId);
        boolean shouldFollow = "follow".equalsIgnoreCase(action) || (!"unfollow".equalsIgnoreCase(action) && !currentlyFollowing);

        if (shouldFollow && !currentlyFollowing) {
            String sql = "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, followerId);
                ps.setString(2, followingId);
                ps.executeUpdate();
                return true;
            } catch (SQLException e) {
                throw new DatabaseException("Failed to follow", e);
            }
        } else if (!shouldFollow && currentlyFollowing) {
            String sql = "DELETE FROM follows WHERE follower_id = ? AND following_id = ?";
            try (Connection conn = DatabaseConfig.getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, followerId);
                ps.setString(2, followingId);
                ps.executeUpdate();
                return false;
            } catch (SQLException e) {
                throw new DatabaseException("Failed to unfollow", e);
            }
        }
        return currentlyFollowing;
    }
}
