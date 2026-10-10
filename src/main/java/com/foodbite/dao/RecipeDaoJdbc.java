package com.foodbite.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Recipe;
import com.foodbite.util.JsonUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class RecipeDaoJdbc implements RecipeDao {

    private Recipe mapRow(ResultSet rs) throws SQLException {
        Recipe r = new Recipe();
        r.setId(rs.getString("id"));
        r.setAuthorId(rs.getString("author_id"));
        r.setAuthorName(rs.getString("author_name"));
        r.setUsername(rs.getString("username"));
        r.setTitle(rs.getString("title"));
        r.setDescription(rs.getString("description"));
        r.setCategory(rs.getString("category"));
        r.setMealType(rs.getString("meal_type"));
        r.setPrepTime(rs.getInt("prep_time"));
        r.setCookingTime(rs.getString("cooking_time"));
        r.setServings(rs.getInt("servings"));
        r.setDifficulty(rs.getString("difficulty"));

        String ingJson = rs.getString("ingredients_json");
        if (ingJson != null && !ingJson.trim().isEmpty()) {
            try {
                r.setIngredients(JsonUtil.fromJson(ingJson, new TypeReference<List<Object>>() {}));
            } catch (Exception e) {
                r.setIngredients(new ArrayList<>());
            }
        } else {
            r.setIngredients(new ArrayList<>());
        }

        String insJson = rs.getString("instructions_json");
        if (insJson != null && !insJson.trim().isEmpty()) {
            try {
                r.setInstructions(JsonUtil.fromJson(insJson, new TypeReference<List<Object>>() {}));
            } catch (Exception e) {
                r.setInstructions(new ArrayList<>());
            }
        } else {
            r.setInstructions(new ArrayList<>());
        }

        String dietJson = rs.getString("dietary_json");
        if (dietJson != null && !dietJson.trim().isEmpty()) {
            try {
                r.setDietary(JsonUtil.fromJson(dietJson, new TypeReference<List<String>>() {}));
            } catch (Exception e) {
                r.setDietary(new ArrayList<>());
            }
        } else {
            r.setDietary(new ArrayList<>());
        }

        r.setImageUrl(rs.getString("image_url"));

        String phoJson = rs.getString("photos_json");
        if (phoJson != null && !phoJson.trim().isEmpty()) {
            try {
                r.setPhotos(JsonUtil.fromJson(phoJson, new TypeReference<List<String>>() {}));
            } catch (Exception e) {
                r.setPhotos(new ArrayList<>());
            }
        } else {
            r.setPhotos(new ArrayList<>());
        }

        r.setStatus(rs.getString("status"));
        r.setRejectionReason(rs.getString("rejection_reason"));
        r.setLikesCount(rs.getInt("likes_count"));
        r.setAverageRating(rs.getDouble("average_rating"));
        if (rs.getTimestamp("created_at") != null) {
            r.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
        }
        return r;
    }

    @Override
    public Optional<Recipe> findById(String id) {
        String sql = "SELECT * FROM recipes WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find recipe by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public List<Recipe> findAll() {
        List<Recipe> list = new ArrayList<>();
        String sql = "SELECT * FROM recipes ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list recipes", e);
        }
        return list;
    }

    @Override
    public List<Recipe> findByAuthorId(String authorId) {
        List<Recipe> list = new ArrayList<>();
        String sql = "SELECT * FROM recipes WHERE author_id = ? ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, authorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list recipes by author: " + authorId, e);
        }
        return list;
    }

    @Override
    public List<Recipe> findApproved() {
        List<Recipe> list = new ArrayList<>();
        String sql = "SELECT * FROM recipes WHERE status = 'approved' ORDER BY created_at DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list approved recipes", e);
        }
        return list;
    }

    @Override
    public void save(Recipe r) {
        String sql = "INSERT INTO recipes (id, author_id, author_name, username, title, description, category, " +
                     "meal_type, prep_time, cooking_time, servings, difficulty, ingredients_json, instructions_json, " +
                     "dietary_json, image_url, photos_json, status, rejection_reason, likes_count, average_rating) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), " +
                     "category = VALUES(category), meal_type = VALUES(meal_type), prep_time = VALUES(prep_time), " +
                     "cooking_time = VALUES(cooking_time), servings = VALUES(servings), difficulty = VALUES(difficulty), " +
                     "ingredients_json = VALUES(ingredients_json), instructions_json = VALUES(instructions_json), " +
                     "dietary_json = VALUES(dietary_json), image_url = VALUES(image_url), photos_json = VALUES(photos_json), " +
                     "status = VALUES(status), rejection_reason = VALUES(rejection_reason)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getId());
            ps.setString(2, r.getAuthorId());
            ps.setString(3, r.getAuthorName());
            ps.setString(4, r.getUsername());
            ps.setString(5, r.getTitle());
            ps.setString(6, r.getDescription());
            ps.setString(7, r.getCategory() != null ? r.getCategory() : "dinner");
            ps.setString(8, r.getMealType());
            ps.setInt(9, r.getPrepTime());
            ps.setString(10, r.getCookingTime());
            ps.setInt(11, r.getServings() > 0 ? r.getServings() : 2);
            ps.setString(12, r.getDifficulty() != null ? r.getDifficulty() : "Medium");
            ps.setString(13, JsonUtil.toJson(r.getIngredients() != null ? r.getIngredients() : new ArrayList<>()));
            ps.setString(14, JsonUtil.toJson(r.getInstructions() != null ? r.getInstructions() : new ArrayList<>()));
            ps.setString(15, JsonUtil.toJson(r.getDietary() != null ? r.getDietary() : new ArrayList<>()));
            ps.setString(16, r.getImageUrl());
            ps.setString(17, JsonUtil.toJson(r.getPhotos() != null ? r.getPhotos() : new ArrayList<>()));
            ps.setString(18, r.getStatus() != null ? r.getStatus() : "approved");
            ps.setString(19, r.getRejectionReason());
            ps.setInt(20, r.getLikesCount());
            ps.setDouble(21, r.getAverageRating());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save recipe: " + r.getTitle(), e);
        }
    }

    @Override
    public void update(Recipe r) {
        String sql = "UPDATE recipes SET title = ?, description = ?, category = ?, meal_type = ?, prep_time = ?, " +
                     "cooking_time = ?, servings = ?, difficulty = ?, ingredients_json = ?, instructions_json = ?, " +
                     "dietary_json = ?, image_url = ?, photos_json = ?, status = ?, rejection_reason = ? " +
                     "WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, r.getTitle());
            ps.setString(2, r.getDescription());
            ps.setString(3, r.getCategory());
            ps.setString(4, r.getMealType());
            ps.setInt(5, r.getPrepTime());
            ps.setString(6, r.getCookingTime());
            ps.setInt(7, r.getServings());
            ps.setString(8, r.getDifficulty());
            ps.setString(9, JsonUtil.toJson(r.getIngredients() != null ? r.getIngredients() : new ArrayList<>()));
            ps.setString(10, JsonUtil.toJson(r.getInstructions() != null ? r.getInstructions() : new ArrayList<>()));
            ps.setString(11, JsonUtil.toJson(r.getDietary() != null ? r.getDietary() : new ArrayList<>()));
            ps.setString(12, r.getImageUrl());
            ps.setString(13, JsonUtil.toJson(r.getPhotos() != null ? r.getPhotos() : new ArrayList<>()));
            ps.setString(14, r.getStatus());
            ps.setString(15, r.getRejectionReason());
            ps.setString(16, r.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update recipe: " + r.getId(), e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM recipes WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete recipe: " + id, e);
        }
    }

    @Override
    public void updateStatus(String id, String status, String rejectionReason) {
        String sql = "UPDATE recipes SET status = ?, rejection_reason = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, rejectionReason);
            ps.setString(3, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update status for recipe: " + id, e);
        }
    }

    @Override
    public void updateRatingAndLikes(String id, double averageRating, int likesCount) {
        String sql = "UPDATE recipes SET average_rating = ?, likes_count = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, averageRating);
            ps.setInt(2, likesCount);
            ps.setString(3, id);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update rating and likes for recipe: " + id, e);
        }
    }
}
