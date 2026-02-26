CREATE TABLE inventory_parts (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    part_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    reorder_point INT,
    reorder_quantity INT,
    supplier_name VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE parts_reservations (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    part_id UUID NOT NULL REFERENCES inventory_parts(id),
    work_order_id UUID NOT NULL,
    quantity_reserved INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    reserved_at TIMESTAMP NOT NULL,
    released_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE stock_ledger (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    part_id UUID NOT NULL REFERENCES inventory_parts(id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    created_by_user_id UUID
);

CREATE INDEX idx_parts_tenant ON inventory_parts(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_parts_branch ON inventory_parts(branch_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_parts_number ON inventory_parts(part_number) WHERE is_deleted = FALSE;
CREATE INDEX idx_reservations_part ON parts_reservations(part_id);
CREATE INDEX idx_reservations_workorder ON parts_reservations(work_order_id);
CREATE INDEX idx_ledger_part ON stock_ledger(part_id);
CREATE INDEX idx_ledger_created ON stock_ledger(created_at);
