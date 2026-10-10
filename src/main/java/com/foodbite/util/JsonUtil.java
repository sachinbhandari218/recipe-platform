package com.foodbite.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodbite.exception.AppException;

public class JsonUtil {
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public static String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new AppException("Failed to serialize object to JSON", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        try {
            if (json == null || json.trim().isEmpty()) return null;
            return mapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new AppException("Failed to deserialize JSON to " + clazz.getSimpleName(), e);
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> typeRef) {
        try {
            if (json == null || json.trim().isEmpty()) return null;
            return mapper.readValue(json, typeRef);
        } catch (Exception e) {
            throw new AppException("Failed to deserialize JSON", e);
        }
    }

    public static ObjectMapper getMapper() {
        return mapper;
    }
}
