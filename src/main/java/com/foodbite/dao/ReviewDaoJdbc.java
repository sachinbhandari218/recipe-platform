package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Review;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ReviewDaoJdbc implements ReviewDao {

    private Review mapRow(ResultSet rs) throws SQLException {
        Review r = new Review();
        r.setId(rs.getString("id"));
        r.setRecipeId(rs.getString("recipe_id"));
        r.setUserId(rs.getString("user_id"));
        r.setUserName(rs.getString("user_name"));
        r.setUserAvatar(rs.getString("user_avatar"));
        r.setRating(rs.getInt("rating"));
        r.setComment(rs.getString("comment"));
        if (rs.getTimestamp("created_at") != null) {
            r.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
        }
        return r;
    }

    @Override
    public Optional<Review> findById(String id) {
        String sql = "SELECT * FROM reviews WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find review: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Review> findAll() {
        List<Review> list = new ArrayList<>();
        String sql = "SELECT * FROM reviews ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list reviews", e);
        }
        return list;
    }

    @Override
    public List<Review> findByRecipeId(String recipeId) {
        List<Review> list = new ArrayList<>();
        String sql = "SELECT * FROM reviews WHERE recipe_id = ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list reviews for recipe: " + recipeId, e);
        }
        return list;
    }

    @Override
    public List<Review> findByUserId(String userId) {
        List<Review> list = new ArrayList<>();
        String sql = "SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list reviews by user: " + userId, e);
        }
        return list;
    }

    @Override
    public void save(Review review) {
        String sql = "INSERT INTO reviews (id, recipe_id, user_id, user_name, user_avatar, rating, comment) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, review.getId());
            ps.setString(2, review.getRecipeId());
            ps.setString(3, review.getUserId());
            ps.setString(4, review.getUserName());
            ps.setString(5, review.getUserAvatar());
            ps.setInt(6, review.getRating());
            ps.setString(7, review.getComment());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save review", e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM reviews WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete review: " + id, e);
        }
    }

    @Override
    public double getAverageRatingForRecipe(String recipeId) {
        String sql = "SELECT AVG(rating) as avg_rating FROM reviews WHERE recipe_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    double avg = rs.getDouble("avg_rating");
                    return Math.round(avg * 100.0) / 100.0;
                }
            }
        } catch (SQLException ignored) {}
        return 0.0;
    }

    @Override
    public int getReviewCountForRecipe(String recipeId) {
        String sql = "SELECT COUNT(*) as cnt FROM reviews WHERE recipe_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, recipeId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("cnt");
            }
        } catch (SQLException ignored) {}
        return 0;
    }
}
