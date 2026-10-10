package com.foodbite.dao;

import com.foodbite.model.Review;
import java.util.List;
import java.util.Optional;

public interface ReviewDao {
    Optional<Review> findById(String id);
    List<Review> findAll();
    List<Review> findByRecipeId(String recipeId);
    List<Review> findByUserId(String userId);
    void save(Review review);
    boolean delete(String id);
    double getAverageRatingForRecipe(String recipeId);
    int getReviewCountForRecipe(String recipeId);
}
