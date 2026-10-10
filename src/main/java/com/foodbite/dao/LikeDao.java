package com.foodbite.dao;

import com.foodbite.model.Like;
import java.util.List;

public interface LikeDao {
    List<Like> findByTargetId(String targetId);
    boolean hasUserLiked(String targetId, String userId);
    boolean toggleLike(String targetId, String userId, String username, String userAvatar);
    int getLikeCount(String targetId);
}
