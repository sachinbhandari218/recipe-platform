package com.foodbite.dao;

import com.foodbite.model.Recipe;
import java.util.List;
import java.util.Optional;

public interface RecipeDao {
    Optional<Recipe> findById(String id);
    List<Recipe> findAll();
    List<Recipe> findByAuthorId(String authorId);
    List<Recipe> findApproved();
    void save(Recipe recipe);
    void update(Recipe recipe);
    boolean delete(String id);
    void updateStatus(String id, String status, String rejectionReason);
    void updateRatingAndLikes(String id, double averageRating, int likesCount);
}
