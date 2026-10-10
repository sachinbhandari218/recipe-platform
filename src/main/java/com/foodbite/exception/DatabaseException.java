package com.foodbite.exception;

public class DatabaseException extends AppException {
    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
    public DatabaseException(String message) {
        super(message);
    }
}
