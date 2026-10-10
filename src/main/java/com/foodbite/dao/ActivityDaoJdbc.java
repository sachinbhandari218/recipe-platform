package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Activity;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ActivityDaoJdbc implements ActivityDao {

    @Override
    public List<Activity> findRecent(int limit) {
        List<Activity> list = new ArrayList<>();
        String sql = "SELECT * FROM activities ORDER BY created_at DESC LIMIT ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 20);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Activity a = new Activity();
                    a.setId(rs.getString("id"));
                    a.setUserId(rs.getString("user_id"));
                    a.setDescription(rs.getString("description"));
                    if (rs.getTimestamp("created_at") != null) {
                        a.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
                    }
                    list.add(a);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list recent activities", e);
        }
        return list;
    }

    @Override
    public void save(Activity a) {
        String sql = "INSERT INTO activities (id, user_id, description) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, a.getId());
            ps.setString(2, a.getUserId());
            ps.setString(3, a.getDescription());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save activity", e);
        }
    }
}
