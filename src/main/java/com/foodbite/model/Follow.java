package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Follow {
    private int id;
    @JsonProperty("followerId")
    private String followerId;
    @JsonProperty("followingId")
    private String followingId;
    @JsonProperty("createdAt")
    private String createdAt;

    public Follow() {}

    public Follow(int id, String followerId, String followingId, String createdAt) {
        this.id = id;
        this.followerId = followerId;
        this.followingId = followingId;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getFollowerId() { return followerId; }
    public void setFollowerId(String followerId) { this.followerId = followerId; }

    public String getFollowingId() { return followingId; }
    public void setFollowingId(String followingId) { this.followingId = followingId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
