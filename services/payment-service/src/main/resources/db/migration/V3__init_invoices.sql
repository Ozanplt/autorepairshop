CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    work_order_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_total DECIMAL(12,2) NOT NULL,
    discount_total DECIMAL(12,2) NOT NULL,
    grand_total DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    issued_at TIMESTAMP,
    due_at TIMESTAMP,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_invoices_work_order ON invoices(work_order_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_invoices_customer ON invoices(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_invoices_status ON invoices(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_invoices_number ON invoices(invoice_number) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX idx_invoices_number_unique ON invoices(tenant_id, invoice_number) WHERE is_deleted = FALSE;

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    tenant_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    discount_rate DECIMAL(5,4) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items(invoice_id) WHERE is_deleted = FALSE;

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    method VARCHAR(30) NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_payments_tenant ON payments(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_payments_status ON payments(status) WHERE is_deleted = FALSE;
