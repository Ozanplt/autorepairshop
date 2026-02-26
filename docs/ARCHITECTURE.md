# Architecture Overview

## System Design Principles

1. **Multi-Tenancy First**: Every entity is tenant-scoped; JWT claims are authoritative
2. **Deny-by-Default Security**: Missing permissions/policies fail closed
3. **Event-Driven Choreography**: Services coordinate via Kafka events with outbox pattern
4. **Idempotency Everywhere**: Critical operations use Idempotency-Key for replay safety
5. **Progressive Disclosure**: Minimum mode first, advanced features opt-in
6. **PII Protection**: Masking by default, explicit permissions for full access
7. **Tamper-Evident Audit**: Hash-chain integrity for compliance

## Service Boundaries

### Gateway Service (Port 8080)
Routes requests, CORS, correlation IDs, rate limiting, security headers

### TenantAdmin Service (Port 8081)
Authoritative for tenants, branches, memberships, roles, permissions, policies

### Customer Service (Port 8082)
Customer profiles, merge/link/unmerge, redirects, DSAR export/anonymization

### Vehicle Service (Port 8083)
Vehicle profiles, plate normalization (DEC-034), ownership history

### WorkOrder Service (Port 8084)
Work orders, fast intake, state machine, saga coordination with Inventory

### Inventory Service (Port 8085)
Parts catalog, stock ledger, reservations (saga participant)

### Payment Service (Port 8086)
Invoices (sequential numbering, immutable after ISSUED), payment ledger

### Appointment Service (Port 8087)
Appointments, business hours, capacity rules, check-in

### File Service (Port 8088)
File attachment metadata, presigned URLs (MinIO), owner-binding validation

### Audit Service (Port 8089)
Append-only audit log, tamper-evident hash chain (DEC-032)

### Notification Service (Port 8090)
Notification templates, channel delivery, pull model for PII

### Query BFF Service (Port 8091)
UI-optimized composite queries, default PII masking

## Security Model

### Authentication
- Keycloak OIDC (JWT RS256)
- Access tokens: short-lived (PT10M default)
- Service-to-service: client credentials (DEC-038)

### Authorization (DEC-019 Evaluation Order)
1. Validate JWT (signature, exp, iss, aud)
2. Extract tenant_id, branch_id, sub from claims
3. Membership validation (TenantAdmin cache, TTL=PT2M, fail-closed on miss)
4. Tenant/branch scope checks
5. Ownership checks
6. Permission checks (RBAC + overrides)
7. Policy checks
8. Rate limits / abuse controls

## Event-Driven Architecture

### Outbox Pattern
- Domain transactions write events to outbox atomically
- Background worker polls outbox, publishes to Kafka
- Retry with exponential backoff + jitter

### Consumer Dedupe
- ProcessedEvent table: (tenant_id, event_id, consumer_group)
- Idempotent handlers (safe to replay)

### Event Envelope
```json
{
  "eventId": "uuid",
  "eventType": "WorkOrderCreated",
  "eventVersion": 1,
  "occurredAt": "2026-01-11T12:00:00Z",
  "producer": "workorder-service",
  "traceId": "...",
  "tenantId": "...",
  "aggregateId": "...",
  "payload": {}
}
```

## Observability

- Structured JSON logs with PII masking
- OpenTelemetry tracing
- Micrometer + Prometheus metrics
- Grafana dashboards
- Health checks: /actuator/health/liveness, /actuator/health/readiness
