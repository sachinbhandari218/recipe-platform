package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class Recipe {
    private String id;
    @JsonProperty("author_id")
    private String authorId;
    @JsonProperty("author_name")
    private String authorName;
    private String username;
    private String title;
    private String description;
    private String category;
    @JsonProperty("meal_type")
    private String mealType;
    @JsonProperty("prep_time")
    private int prepTime;
    @JsonProperty("cooking_time")
    private String cookingTime;
    private int servings;
    private String difficulty;
    private List<Object> ingredients;
    private List<Object> instructions;
    private List<String> dietary;
    @JsonProperty("image_url")
    private String imageUrl;
    private List<String> photos;
    private String status;
    @JsonProperty("rejection_reason")
    private String rejectionReason;
    @JsonProperty("likes_count")
    private int likesCount;
    @JsonProperty("average_rating")
    private double averageRating;
    @JsonProperty("created_at")
    private String createdAt;

    public Recipe() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    @JsonProperty("recipe_id")
    public String getRecipeId() { return id; }
    public void setRecipeId(String recipeId) { if (this.id == null) this.id = recipeId; }

    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }

    @JsonProperty("author_uid")
    public String getAuthorUid() { return authorId; }
    public void setAuthorUid(String authorUid) { if (this.authorId == null) this.authorId = authorUid; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public int getPrepTime() { return prepTime; }
    public void setPrepTime(int prepTime) { this.prepTime = prepTime; }

    public String getCookingTime() { return cookingTime; }
    public void setCookingTime(String cookingTime) { this.cookingTime = cookingTime; }

    @JsonProperty("cookTime")
    public String getCookTime() { return cookingTime; }
    public void setCookTime(String cookTime) { if (this.cookingTime == null) this.cookingTime = cookTime; }

    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public List<Object> getIngredients() { return ingredients; }
    public void setIngredients(List<Object> ingredients) { this.ingredients = ingredients; }

    public List<Object> getInstructions() { return instructions; }
    public void setInstructions(List<Object> instructions) { this.instructions = instructions; }

    public List<String> getDietary() { return dietary; }
    public void setDietary(List<String> dietary) { this.dietary = dietary; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { this.photos = photos; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public int getLikesCount() { return likesCount; }
    public void setLikesCount(int likesCount) { this.likesCount = likesCount; }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
