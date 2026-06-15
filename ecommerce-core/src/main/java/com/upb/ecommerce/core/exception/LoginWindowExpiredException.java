package com.upb.ecommerce.core.exception;

public class LoginWindowExpiredException extends RuntimeException {

    public LoginWindowExpiredException(String message) {
        super(message);
    }
}
