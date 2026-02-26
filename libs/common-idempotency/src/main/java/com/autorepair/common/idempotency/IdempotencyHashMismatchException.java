package com.autorepair.common.idempotency;

public class IdempotencyHashMismatchException extends RuntimeException {
    public IdempotencyHashMismatchException(String message) {
        super(message);
    }
}
