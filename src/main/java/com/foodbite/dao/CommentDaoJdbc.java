package com.foodbite.dao;

import com.foodbite.config.DatabaseConfig;
import com.foodbite.exception.DatabaseException;
import com.foodbite.model.Comment;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CommentDaoJdbc implements CommentDao {

    @Override
    public List<Comment> findByPostId(String postId) {
        List<Comment> list = new ArrayList<>();
        String sql = "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, postId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Comment c = new Comment();
                    c.setId(rs.getString("id"));
                    c.setPostId(rs.getString("post_id"));
                    c.setUserId(rs.getString("user_id"));
                    c.setUsername(rs.getString("username"));
                    c.setUserAvatar(rs.getString("user_avatar"));
                    c.setText(rs.getString("text"));
                    if (rs.getTimestamp("created_at") != null) {
                        c.setCreatedAt(rs.getTimestamp("created_at").toInstant().toString());
                    }
                    list.add(c);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list comments for post: " + postId, e);
        }
        return list;
    }

    @Override
    public void save(Comment comment) {
        String sql = "INSERT INTO comments (id, post_id, user_id, username, user_avatar, text) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, comment.getId());
            ps.setString(2, comment.getPostId());
            ps.setString(3, comment.getUserId());
            ps.setString(4, comment.getUsername());
            ps.setString(5, comment.getUserAvatar());
            ps.setString(6, comment.getText());
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save comment", e);
        }
    }

    @Override
    public boolean delete(String id) {
        String sql = "DELETE FROM comments WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete comment: " + id, e);
        }
    }
}
