CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_id UUID,
    customer_id UUID NOT NULL,
    vehicle_id UUID,
    work_order_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status VARCHAR(20) NOT NULL,
    assigned_to_user_id UUID,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by_user_id UUID,
    updated_by_user_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_appointments_branch ON appointments(branch_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_appointments_customer ON appointments(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_appointments_date ON appointments(appointment_date) WHERE is_deleted = FALSE;
CREATE INDEX idx_appointments_status ON appointments(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_appointments_assigned ON appointments(assigned_to_user_id) WHERE is_deleted = FALSE;
