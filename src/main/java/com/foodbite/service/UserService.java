package com.foodbite.service;

import com.foodbite.dao.FollowDao;
import com.foodbite.dao.FollowDaoJdbc;
import com.foodbite.dao.UserDao;
import com.foodbite.dao.UserDaoJdbc;
import com.foodbite.exception.ResourceNotFoundException;
import com.foodbite.model.User;
import com.foodbite.util.SecurityUtil;

import java.util.List;
import java.util.Optional;

public class UserService {
    private final UserDao userDao;
    private final FollowDao followDao;

    public UserService() {
        this.userDao = new UserDaoJdbc();
        this.followDao = new FollowDaoJdbc();
    }

    public UserService(UserDao userDao, FollowDao followDao) {
        this.userDao = userDao;
        this.followDao = followDao;
    }

    public List<User> getAllUsers() {
        return userDao.findAll();
    }

    public User getUserById(String id) {
        return userDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public Optional<User> findUserById(String id) {
        return userDao.findById(id);
    }

    public void updateUserProfile(String id, String name, String email, String avatarUrl, String bio, String newPassword) {
        User u = getUserById(id);
        if (name != null && !name.trim().isEmpty()) {
            u.setName(name.trim());
            u.setDisplayName(name.trim());
        }
        if (email != null && email.contains("@")) {
            u.setEmail(email.trim().toLowerCase());
        }
        if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
            u.setAvatarUrl(avatarUrl.trim());
        }
        if (bio != null) {
            u.setBio(bio.trim());
        }
        if (newPassword != null && newPassword.length() >= 5) {
            u.setPasswordHash(SecurityUtil.hashPassword(newPassword));
        }
        userDao.update(u);
    }

    public void updateUserRole(String id, String newRole) {
        User u = getUserById(id);
        u.setRole(newRole);
        userDao.update(u);
    }

    public boolean deleteUser(String id) {
        return userDao.delete(id);
    }

    public List<String> getFollowing(String userId) {
        return followDao.getFollowingOf(userId);
    }

    public List<String> getFollowers(String userId) {
        return followDao.getFollowersOf(userId);
    }

    public boolean toggleFollow(String followerId, String followingId, String action) {
        return followDao.toggleFollow(followerId, followingId, action);
    }
}
