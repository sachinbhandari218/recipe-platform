package com.foodbite.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.sql.Timestamp;

public class User {
    private String id;
    private String email;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String passwordHash;
    private String name;
    @JsonProperty("display_name")
    private String displayName;
    private String username;
    private String role;
    @JsonProperty("avatar_url")
    private String avatarUrl;
    private String bio;
    private int streak;
    @JsonProperty("created_at")
    private String createdAt;

    public User() {}

    public User(String id, String email, String passwordHash, String name, String displayName, String username, String role, String avatarUrl, String bio, int streak, String createdAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.displayName = displayName;
        this.username = username;
        this.role = role;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.streak = streak;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    @JsonProperty("uid")
    public String getUid() { return id; }
    public void setUid(String uid) { if (this.id == null) this.id = uid; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDisplayName() { return displayName != null ? displayName : name; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    @JsonProperty("avatar")
    public String getAvatar() { return avatarUrl; }
    public void setAvatar(String avatar) { if (this.avatarUrl == null) this.avatarUrl = avatar; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public int getStreak() { return streak; }
    public void setStreak(int streak) { this.streak = streak; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
