package com.foodbite.dao;

import com.foodbite.model.EphemeralPost;
import java.util.List;
import java.util.Optional;

public interface EphemeralPostDao {
    List<EphemeralPost> findActive();
    List<EphemeralPost> findActiveByUser(String userId);
    Optional<EphemeralPost> findById(String id);
    void save(EphemeralPost post);
    boolean delete(String id, String userId);
    void purgeExpired();
}
