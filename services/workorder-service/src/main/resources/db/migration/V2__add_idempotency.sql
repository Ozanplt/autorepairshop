-- Idempotency records table
CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    endpoint_key VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_status INTEGER NOT NULL,
    response_body TEXT,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_idempotency UNIQUE (tenant_id, endpoint_key, idempotency_key)
);

CREATE INDEX idx_idempotency_expires ON idempotency_records(expires_at);
