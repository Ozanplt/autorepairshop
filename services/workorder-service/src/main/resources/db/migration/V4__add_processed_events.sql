-- Processed events table for consumer dedupe
CREATE TABLE processed_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_id UUID NOT NULL,
    consumer_group VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    CONSTRAINT uk_processed_event UNIQUE (tenant_id, event_id, consumer_group)
);

CREATE INDEX idx_processed_events_expires ON processed_events(expires_at);
