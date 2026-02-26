# Decision Log

This document records all architectural and implementation decisions made for the AutoRepairShop Management System, following the Blueprint JSON specification.

## DEC-001: JWT Claims Standard for Tenant/Branch Scoping
**Decision**: All services treat JWT claims as authoritative for tenant/branch scope.
**Required Claims**: sub, tenant_id
**Optional Claims**: branch_id, roles, scope, locale
**Validation**: Missing tenant_id → 403; Missing branch_id when required → 403

## DEC-002: Policy Storage, Versioning, and Publishing
**Decision**: Tenant policies are versioned, publishable, and auditable.
**Versioning**: Monotonic integer per tenant and policy category
**Distribution**: PolicyUpdated event on publish; services invalidate cache

## DEC-003: Customer Merge Reversibility
**Decision**: Merge supports admin-only compensating 'unmerge' operation.
**Implementation**: Merge plan stored; CustomerRedirect records preserved

## DEC-004: Idempotency Key Replay Safety
**Decision**: Same key + different payload → 409 Conflict
**Storage**: (tenantId, idempotencyKey, requestHash, response)
**TTL**: PT24H for fast intake, P7D for payments, P30D for webhooks

## DEC-008: Policy Resolve Precedence
**Order**: BRANCH → TENANT → DEFAULTS
**Fail-Safe**: FAIL_CLOSED for protected operations, FAIL_OPEN for UX hints

## DEC-009: Soft Delete + Uniqueness Strategy
**Implementation**: Partial unique indexes (PostgreSQL): WHERE is_deleted = false
**Restore**: Conflict check required; 409 if active record exists

## DEC-011: Idempotency Response Snapshot Minimization
**Allowed**: resourceId, status, location, createdAt
**Forbidden**: PII, tokens, card data, auth headers

## DEC-012: Invite Token Security Model
**TTL**: PT48H
**Storage**: Hashed at rest (SHA-256)
**Validation**: Constant-time comparison
**Abuse Controls**: IP throttling, per-tenant quotas, audit all attempts

## DEC-015: Membership Validation Timeout and Fallback
**Timeouts**: connect=PT0.2S, read=PT0.5S
**Cache TTL**: PT2M
**Fallback**: Deny (403) on cache miss for protected operations

## DEC-019: Authorization Evaluation Order
1. Authenticate JWT
2. Extract tenant_id/branch_id/sub
3. Membership validation
4. Scope checks
5. Ownership checks
6. Permission checks
7. Policy checks
8. Rate limits

## DEC-025: Idempotency Atomicity and Request Hashing
**Hash**: SHA-256 of canonical JSON (sorted keys, normalized whitespace)
**Uniqueness**: unique(tenantId, idempotencyKey, endpointKey)
**Concurrency**: First writer wins

## DEC-026: File Presign Security Baseline
**Upload TTL**: PT10M
**Download TTL**: PT10M
**Max Size**: 25MB default
**Allowed Types**: image/jpeg, image/png, application/pdf
**Owner Binding**: Required before presign issuance

## DEC-027: Error Code Catalog is Mandatory
**Format**: Every non-2xx includes errorCode and errorId
**Localization**: message uses messageKey + args

## DEC-032: Audit Log Tamper-Evident Integrity
**Hash Chain**: SHA-256 per tenant
**Fields**: auditLogId, occurredAt, actorUserId, eventType, metadata, prevHash
**Verification**: Nightly integrity check; alert on mismatch

## DEC-034: Plate Normalization Canonical Algorithm
1. Trim
2. Uppercase (Locale.ROOT)
3. Remove spaces, hyphens, dots
4. Allow only [A-Z0-9]
5. Length 2..16
**Fields**: rawPlate (display), normalizedPlate (uniqueness/search)

## DEC-036: API Concurrency Standard (ETag/If-Match)
**Mechanism**: ETag on GET, If-Match on PUT/PATCH
**Missing If-Match**: 428 Precondition Required
**Version Mismatch**: 409 ERR_RESOURCE_CONFLICT

## DEC-037: WorkOrder–Inventory Saga Contract
**Events**: PartsReservationRequested, PartsReserved, PartsReservationRejected, PartsConsumptionRecorded, PartsReturnRecorded
**Idempotency**: All commands include idempotencyKey and correlationId
**Compensation**: Rejection → WorkOrder flags inconsistency for admin review

## DEC-038: Service-to-Service Authentication
**Preferred**: OIDC Client Credentials
**Requirements**: aud must match target service; scopes required
**Transport**: HTTPS required; mTLS optional via service mesh

## DEC-040: Identity & User Lifecycle Baseline
**IdP**: Keycloak (OIDC)
**Principals**: StaffPrincipal, CustomerPrincipal, MachinePrincipal
**Provisioning**: Invite-based for staff; invite/register for customers
**MFA**: Required for enterprise staff by policy

## DEC-041: Tenant/Branch/Role/Policy Data Model
**Entities**: Tenant, Branch, Role, TenantMembership, RoleAssignment, PolicyRecord
**Invariants**: Tenant.status=SUSPENDED → protected writes fail closed
**Events**: TenantUpdated, BranchUpdated, RoleUpdated, PolicyUpdated

## DEC-042: Event Catalog
**Required Fields**: eventType, eventVersion, producer, aggregateType, partitionKeyStrategy, piiClass
**Serialization**: JSON with BACKWARD compatibility
**Schema Registry**: Required in Kafka deployments

## DEC-043: State Machines
**WorkOrder**: DRAFT → OPEN → IN_PROGRESS → WAITING_CUSTOMER_APPROVAL → COMPLETED/CANCELED
**Invoice**: DRAFT → ISSUED → PARTIALLY_PAID/PAID/OVERDUE/CANCELED
**Immutability**: Invoice monetary snapshot immutable after ISSUED

## DEC-044: Data Classification
**Labels**: AUTH_SECRET, PII, FINANCIAL, SENSITIVE_NOTES, OPERATIONAL
**Rules**: Mask PII in logs; never log AUTH_SECRET; IDs only in events

## DEC-045: Abuse Controls
**Invites**: One-time, TTL, hashed, throttled
**Search**: Min query length, rate limits, enumeration detection
**Webhooks**: Signature verification, timestamp skew, replay prevention
