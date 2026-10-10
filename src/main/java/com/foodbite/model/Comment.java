package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Comment {
    private String id;
    @JsonProperty("postId")
    private String postId;
    @JsonProperty("userId")
    private String userId;
    private String username;
    @JsonProperty("userAvatar")
    private String userAvatar;
    private String text;
    @JsonProperty("createdAt")
    private String createdAt;

    public Comment() {}

    public Comment(String id, String postId, String userId, String username, String userAvatar, String text, String createdAt) {
        this.id = id;
        this.postId = postId;
        this.userId = userId;
        this.username = username;
        this.userAvatar = userAvatar;
        this.text = text;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPostId() { return postId; }
    public void setPostId(String postId) { this.postId = postId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUserAvatar() { return userAvatar; }
    public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
