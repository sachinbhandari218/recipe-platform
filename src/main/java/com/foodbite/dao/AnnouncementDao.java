package com.foodbite.dao;

import com.foodbite.model.Announcement;

public interface AnnouncementDao {
    Announcement getAnnouncement();
    void saveAnnouncement(Announcement announcement);
}
