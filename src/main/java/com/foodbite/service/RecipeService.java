package com.foodbite.service;

import com.foodbite.dao.*;
import com.foodbite.exception.ResourceNotFoundException;
import com.foodbite.exception.ValidationException;
import com.foodbite.model.Activity;
import com.foodbite.model.Recipe;
import com.foodbite.model.Review;

import java.util.List;
import java.util.Optional;

public class RecipeService {
    private final RecipeDao recipeDao;
    private final ReviewDao reviewDao;
    private final LikeDao likeDao;
    private final ActivityDao activityDao;

    public RecipeService() {
        this.recipeDao = new RecipeDaoJdbc();
        this.reviewDao = new ReviewDaoJdbc();
        this.likeDao = new LikeDaoJdbc();
        this.activityDao = new ActivityDaoJdbc();
    }

    public RecipeService(RecipeDao recipeDao, ReviewDao reviewDao, LikeDao likeDao, ActivityDao activityDao) {
        this.recipeDao = recipeDao;
        this.reviewDao = reviewDao;
        this.likeDao = likeDao;
        this.activityDao = activityDao;
    }

    public List<Recipe> getAllRecipes() {
        return recipeDao.findAll();
    }

    public List<Recipe> getApprovedRecipes() {
        return recipeDao.findApproved();
    }

    public List<Recipe> getRecipesByAuthor(String authorId) {
        return recipeDao.findByAuthorId(authorId);
    }

    public Recipe getRecipeById(String id) {
        return recipeDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + id));
    }

    public void createRecipe(Recipe recipe) {
        if (recipe.getTitle() == null || recipe.getTitle().trim().isEmpty()) {
            throw new ValidationException("Recipe title is required");
        }
        if (recipe.getId() == null || recipe.getId().trim().isEmpty()) {
            recipe.setId("rec-" + System.currentTimeMillis());
        }
        if (recipe.getStatus() == null || recipe.getStatus().trim().isEmpty()) {
            recipe.setStatus("approved");
        }
        recipeDao.save(recipe);

        String author = recipe.getAuthorName() != null ? recipe.getAuthorName() : "Chef";
        activityDao.save(new Activity("act-" + System.currentTimeMillis(), recipe.getAuthorId(), author + " submitted a new recipe: " + recipe.getTitle(), null));
    }

    public void updateRecipe(Recipe recipe) {
        recipeDao.update(recipe);
    }

    public boolean deleteRecipe(String id, String requestingUserId, boolean isAdmin) {
        Optional<Recipe> rOpt = recipeDao.findById(id);
        if (rOpt.isEmpty()) return false;
        Recipe r = rOpt.get();
        if (!isAdmin && requestingUserId != null && !requestingUserId.equals(r.getAuthorId())) {
            throw new ValidationException("You can only delete your own recipes");
        }
        return recipeDao.delete(id);
    }

    public void moderateRecipe(String id, String status, String rejectionReason) {
        recipeDao.updateStatus(id, status, rejectionReason);
        Recipe r = getRecipeById(id);
        String actionText = "approved".equalsIgnoreCase(status) ? "approved" : "rejected";
        activityDao.save(new Activity("act-" + System.currentTimeMillis(), "usr-1", "Admin " + actionText + " recipe: " + r.getTitle(), null));
    }

    public void addReview(Review review) {
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new ValidationException("Rating must be between 1 and 5 stars");
        }
        if (review.getId() == null || review.getId().trim().isEmpty()) {
            review.setId("rev-" + System.currentTimeMillis());
        }
        reviewDao.save(review);

        double newAvg = reviewDao.getAverageRatingForRecipe(review.getRecipeId());
        int likes = likeDao.getLikeCount(review.getRecipeId());
        recipeDao.updateRatingAndLikes(review.getRecipeId(), newAvg, likes);

        String author = review.getUserName() != null ? review.getUserName() : "User";
        activityDao.save(new Activity("act-" + System.currentTimeMillis(), review.getUserId(), author + " reviewed recipe (" + review.getRating() + "★)", null));
    }

    public boolean toggleLike(String recipeId, String userId, String username, String userAvatar) {
        return likeDao.toggleLike(recipeId, userId, username, userAvatar);
    }
}
