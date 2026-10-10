package com.foodbite.dao;

import java.util.List;

public interface FollowDao {
    List<String> getFollowingOf(String userId);
    List<String> getFollowersOf(String userId);
    boolean isFollowing(String followerId, String followingId);
    boolean toggleFollow(String followerId, String followingId, String action);
}
