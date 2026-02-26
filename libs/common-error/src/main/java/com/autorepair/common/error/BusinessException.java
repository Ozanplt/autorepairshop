package com.autorepair.common.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    private final String messageKey;
    private final HttpStatus httpStatus;

    public BusinessException(ErrorCode errorCode, String message, String messageKey, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.messageKey = messageKey;
        this.httpStatus = httpStatus;
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(ErrorCode.ERR_RESOURCE_NOT_FOUND, message, "error.resource.not.found", HttpStatus.NOT_FOUND);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(ErrorCode.ERR_RESOURCE_CONFLICT, message, "error.resource.conflict", HttpStatus.CONFLICT);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException(ErrorCode.ERR_AUTH_FORBIDDEN, message, "error.auth.forbidden", HttpStatus.FORBIDDEN);
    }

    public static BusinessException unauthorized(String message) {
        return new BusinessException(ErrorCode.ERR_AUTH_UNAUTHORIZED, message, "error.auth.unauthorized", HttpStatus.UNAUTHORIZED);
    }
}
