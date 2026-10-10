package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Like {
    private int id;
    @JsonProperty("postId")
    private String targetId;
    @JsonProperty("userId")
    private String userId;
    private String username;
    @JsonProperty("userAvatar")
    private String userAvatar;
    @JsonProperty("createdAt")
    private String createdAt;

    public Like() {}

    public Like(int id, String targetId, String userId, String username, String userAvatar, String createdAt) {
        this.id = id;
        this.targetId = targetId;
        this.userId = userId;
        this.username = username;
        this.userAvatar = userAvatar;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUserAvatar() { return userAvatar; }
    public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
