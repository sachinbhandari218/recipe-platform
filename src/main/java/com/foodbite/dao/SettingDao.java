package com.foodbite.dao;

import java.util.Map;

public interface SettingDao {
    Map<String, String> getAllSettings();
    String getSetting(String key, String defaultValue);
    void setSetting(String key, String value);
    void saveSettings(Map<String, String> settings);
}
