package com.foodbite.dao;

import com.foodbite.model.Notification;
import java.util.List;

public interface NotificationDao {
    List<Notification> findByUserId(String userId);
    void save(Notification notification);
    void markAsRead(String notificationId);
}
