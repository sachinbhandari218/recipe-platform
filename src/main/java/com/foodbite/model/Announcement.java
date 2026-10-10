package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Announcement {
    private int id;
    private boolean enabled;
    private String title;
    private String message;
    private String type;
    @JsonProperty("updatedBy")
    private String updatedBy;
    @JsonProperty("updatedAt")
    private long updatedAt;

    public Announcement() {}

    public Announcement(int id, boolean enabled, String title, String message, String type, String updatedBy, long updatedAt) {
        this.id = id;
        this.enabled = enabled;
        this.title = title;
        this.message = message;
        this.type = type;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
