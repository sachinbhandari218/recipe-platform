package com.foodbite.dao;

import com.foodbite.model.Activity;
import java.util.List;

public interface ActivityDao {
    List<Activity> findRecent(int limit);
    void save(Activity activity);
}
