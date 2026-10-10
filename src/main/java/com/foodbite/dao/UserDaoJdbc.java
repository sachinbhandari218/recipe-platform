package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.User;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class UserDaoJdbc implements UserDao {

    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getString("id"));
        u.setEmail(rs.getString("email"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setName(rs.getString("name"));
        u.setDisplayName(rs.getString("display_name"));
        u.setUsername(rs.getString("username"));
        u.setRole(rs.getString("role"));
        u.setAvatarUrl(rs.getString("avatar_url"));
        u.setBio(rs.getString("bio"));
        u.setStreak(rs.getInt("streak"));
        if (rs.getTimestamp("created_at") != null) {
            u.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
        }
        return u;
    }

    @Override
    public Optional<User> findById(String id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find user by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find user by email: " + email, e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE LOWER(username) = LOWER(?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username.trim());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find user by username: " + username, e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT * FROM users ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list users", e);
        }
        return list;
    }

    @Override
    public void save(User user) {
        String sql = "INSERT INTO users (id, email, password_hash, name, display_name, username, role, avatar_url, bio, streak) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE name = VALUES(name), display_name = VALUES(display_name), " +
                     "password_hash = VALUES(password_hash), role = VALUES(role), avatar_url = VALUES(avatar_url), " +
                     "bio = VALUES(bio), streak = VALUES(streak)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getId());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash() != null ? user.getPasswordHash() : "");
            ps.setString(4, user.getName());
            ps.setString(5, user.getDisplayName());
            ps.setString(6, user.getUsername());
            ps.setString(7, user.getRole() != null ? user.getRole() : "user");
            ps.setString(8, user.getAvatarUrl());
            ps.setString(9, user.getBio());
            ps.setInt(10, user.getStreak());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save user: " + user.getEmail(), e);
        }
    }

    @Override
    public void update(User user) {
        String sql = "UPDATE users SET email = ?, name = ?, display_name = ?, role = ?, avatar_url = ?, bio = ?, streak = ?" +
                     (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty() ? ", password_hash = ?" : "") +
                     " WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int idx = 1;
            ps.setString(idx++, user.getEmail());
            ps.setString(idx++, user.getName());
            ps.setString(idx++, user.getDisplayName());
            ps.setString(idx++, user.getRole());
            ps.setString(idx++, user.getAvatarUrl());
            ps.setString(idx++, user.getBio());
            ps.setInt(idx++, user.getStreak());
            if (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty()) {
                ps.setString(idx++, user.getPasswordHash());
            }
            ps.setString(idx, user.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update user: " + user.getId(), e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete user: " + id, e);
        }
    }

    @Override
    public int getStreak(String userId) {
        String sql = "SELECT streak FROM users WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("streak");
                }
            }
        } catch (SQLException ignored) {}
        return 0;
    }

    @Override
    public int updateStreak(String userId) {
        String sql = "UPDATE users SET streak = streak + 1 WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            ps.executeUpdate();
            return getStreak(userId);
        } catch (SQLException e) {
            return getStreak(userId);
        }
    }
}
