package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Notification {
    private String id;
    @JsonProperty("userId")
    private String userId;
    @JsonProperty("actorId")
    private String actorId;
    @JsonProperty("actorName")
    private String actorName;
    @JsonProperty("actorAvatar")
    private String actorAvatar;
    private String type;
    private String message;
    @JsonProperty("targetId")
    private String targetId;
    @JsonProperty("isRead")
    private boolean isRead;
    @JsonProperty("createdAt")
    private String createdAt;

    public Notification() {}

    public Notification(String id, String userId, String actorId, String actorName, String actorAvatar, String type, String message, String targetId, boolean isRead, String createdAt) {
        this.id = id;
        this.userId = userId;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorAvatar = actorAvatar;
        this.type = type;
        this.message = message;
        this.targetId = targetId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getActorAvatar() { return actorAvatar; }
    public void setActorAvatar(String actorAvatar) { this.actorAvatar = actorAvatar; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
