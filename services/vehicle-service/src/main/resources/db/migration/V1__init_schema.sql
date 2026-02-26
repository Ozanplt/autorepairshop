CREATE TABLE vehicles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    customer_id UUID NOT NULL,
    raw_plate VARCHAR(20) NOT NULL,
    normalized_plate VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    vin VARCHAR(17),
    color VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_vehicles_branch ON vehicles(branch_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_vehicles_normalized_plate ON vehicles(normalized_plate) WHERE is_deleted = FALSE;
CREATE INDEX idx_vehicles_raw_plate ON vehicles(raw_plate) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX idx_vehicles_plate_unique ON vehicles(tenant_id, normalized_plate) WHERE is_deleted = FALSE;
