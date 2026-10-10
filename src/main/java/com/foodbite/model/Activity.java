package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Activity {
    private String id;
    @JsonProperty("user_id")
    private String userId;
    private String description;
    @JsonProperty("created_at")
    private String createdAt;

    public Activity() {}

    public Activity(String id, String userId, String description, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.description = description;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
