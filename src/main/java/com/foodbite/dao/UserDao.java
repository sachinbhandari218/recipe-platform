package com.foodbite.dao;

import com.foodbite.model.User;
import java.util.List;
import java.util.Optional;

public interface UserDao {
    Optional<User> findById(String id);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    List<User> findAll();
    void save(User user);
    void update(User user);
    boolean delete(String id);
    int getStreak(String userId);
    int updateStreak(String userId);
}
