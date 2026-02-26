-- Work Orders table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    customer_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    sub_status VARCHAR(100),
    problem_short_note VARCHAR(240),
    problem_details TEXT,
    assigned_to_user_id UUID,
    intake_mileage INTEGER,
    diagnostics_notes TEXT,
    currency VARCHAR(3),
    invoice_id UUID,
    completed_at TIMESTAMP,
    pricing_snapshot JSONB,
    flags JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_branch ON work_orders(branch_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_status ON work_orders(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_created_at ON work_orders(created_at) WHERE is_deleted = FALSE;

-- Work Order Labor Items
CREATE TABLE work_order_labor_items (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    quantity_hours DECIMAL(10,2) NOT NULL CHECK (quantity_hours >= 0),
    unit_rate DECIMAL(10,2) NOT NULL CHECK (unit_rate >= 0),
    tax_rate DECIMAL(5,4) CHECK (tax_rate >= 0 AND tax_rate <= 1),
    discount_rate DECIMAL(5,4) CHECK (discount_rate >= 0 AND discount_rate <= 1),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_labor_items_work_order ON work_order_labor_items(work_order_id) WHERE is_deleted = FALSE;

-- Work Order Part Items
CREATE TABLE work_order_part_items (
    id UUID PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    tenant_id UUID NOT NULL,
    inventory_part_id UUID,
    custom_part_name VARCHAR(120),
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity >= 0),
    unit_price_snapshot DECIMAL(10,2),
    currency VARCHAR(3),
    status VARCHAR(50) NOT NULL,
    reservation_id UUID,
    external_reference VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_part_items_work_order ON work_order_part_items(work_order_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_part_items_status ON work_order_part_items(status) WHERE is_deleted = FALSE;
