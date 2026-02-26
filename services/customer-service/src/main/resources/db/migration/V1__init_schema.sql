-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    type VARCHAR(20) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_e164 VARCHAR(20),
    email_normalized VARCHAR(254),
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    address TEXT,
    associated_user_id UUID,
    status VARCHAR(20) NOT NULL,
    merged_into_customer_id UUID,
    anonymized_at TIMESTAMP,
    anonymization_profile VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_customers_branch ON customers(branch_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_customers_phone ON customers(phone_e164) WHERE is_deleted = FALSE AND phone_e164 IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email_normalized) WHERE is_deleted = FALSE AND email_normalized IS NOT NULL;
CREATE INDEX idx_customers_status ON customers(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_customers_full_name ON customers(full_name) WHERE is_deleted = FALSE;

-- Customer redirects table for merge tracking
CREATE TABLE customer_redirects (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    source_customer_id UUID NOT NULL,
    target_customer_id UUID NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    created_by_user_id UUID
);

CREATE INDEX idx_customer_redirects_source ON customer_redirects(source_customer_id);
CREATE INDEX idx_customer_redirects_target ON customer_redirects(target_customer_id);
CREATE INDEX idx_customer_redirects_tenant ON customer_redirects(tenant_id);
