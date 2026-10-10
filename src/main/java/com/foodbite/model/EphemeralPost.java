package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class EphemeralPost {
    private String id;
    @JsonProperty("userId")
    private String userId;
    private String username;
    @JsonProperty("userAvatar")
    private String userAvatar;
    @JsonProperty("mediaUrl")
    private String mediaUrl;
    @JsonProperty("mediaPath")
    private String mediaPath;
    @JsonProperty("mediaType")
    private String mediaType;
    @JsonProperty("mediaBase64")
    private String mediaBase64;
    private String category;
    private String caption;
    private double duration;
    @JsonProperty("createdAt")
    private long createdAt;
    @JsonProperty("expiresAt")
    private long expiresAt;

    public EphemeralPost() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUserAvatar() { return userAvatar; }
    public void setUserAvatar(String userAvatar) { this.userAvatar = userAvatar; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getMediaPath() { return mediaPath; }
    public void setMediaPath(String mediaPath) { this.mediaPath = mediaPath; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getMediaBase64() { return mediaBase64; }
    public void setMediaBase64(String mediaBase64) { this.mediaBase64 = mediaBase64; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public double getDuration() { return duration; }
    public void setDuration(double duration) { this.duration = duration; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(long expiresAt) { this.expiresAt = expiresAt; }
}
