package com.foodbite.dao;

import com.foodbite.model.Comment;
import java.util.List;

public interface CommentDao {
    List<Comment> findByPostId(String postId);
    void save(Comment comment);
    boolean delete(String id);
}
