# Security Model

## Authentication

### Keycloak OIDC
- JWT RS256 tokens
- Access token lifetime: PT10M (configurable)
- Refresh tokens: frontend only, never forwarded to services
- JWKS caching: PT10M TTL, refresh on signature failure

### Service-to-Service (DEC-038)
- Client credentials flow
- Audience validation required
- Least-privilege scopes
- mTLS optional via service mesh

## Authorization

### Evaluation Order (DEC-019)
1. JWT validation (signature, exp, iss, aud)
2. Extract claims: tenant_id, branch_id, sub
3. Membership validation (TenantAdmin cache, TTL=PT2M)
4. Tenant/branch scope enforcement
5. Ownership checks (customer self-service)
6. Permission checks (RBAC + overrides)
7. Policy checks (required fields, workflow guards)
8. Rate limits / abuse controls

### Deny-by-Default
- Missing permission mapping → 403
- Cache miss on membership validation → 403 for protected operations
- Invalid/missing tenant_id claim → 403
- Branch required but missing branch_id → 403

## PII Protection

### Data Classification (DEC-044)
- AUTH_SECRET: passwords, tokens, API keys
- PII: fullName, phoneE164, emailNormalized, address
- FINANCIAL: amounts, card data, transaction details
- SENSITIVE_NOTES: problem descriptions, diagnostics

### Masking Standards
- Phone: `*******12` (last 2 digits)
- Email: `a***@d***.com`
- UUID: first 8 chars
- Token: never log

### Logging Rules
- Never log AUTH_SECRET
- Mask PII in all logs
- Avoid SENSITIVE_NOTES unless explicitly enabled with redaction
- Request/response logging: OFF in prod

## Idempotency (DEC-004, DEC-025)

### Mechanism
- Idempotency-Key header (client-provided)
- Server stores: (tenantId, endpointKey, idempotencyKey, requestHash, response)
- Same key + different payload → 409 Conflict
- Same key + same payload → return stored response

### Request Hashing
- SHA-256 of canonical JSON payload
- Sort keys recursively
- Normalize whitespace
- Exclude volatile headers

### Response Snapshot (DEC-011)
- Store minimal safe fields only
- Allowed: resourceId, status, location, createdAt
- Forbidden: PII, tokens, card data

## Audit Trail (DEC-032)

### Tamper-Evident Hash Chain
- Each audit log includes prevHash
- Hash algorithm: SHA-256
- Fields: auditLogId, occurredAt, actorUserId, eventType, tenantId, resourceType, resourceId, summary, metadata, prevHash
- Nightly verification job per tenant
- Alert on mismatch → freeze export, escalate

### Always Audited
- Customer merge/link/unmerge
- Policy publish
- Role/permission changes
- Payment/refund operations
- File presign issuance
- DSAR export/anonymization

### 403 Volume Control (DEC-014)
- Rate-limit 403 audit events: max 60/min per tenant
- Always capture: critical operations (see above)
- Enterprise option: full 403 capture

## File Security (DEC-026)

### Presigned URLs
- Upload TTL: PT10M
- Download TTL: PT10M
- Owner-binding validation required
- Tenant isolation prefix enforced

### Allowlists
- Max size: 25MB default
- Allowed content types: image/jpeg, image/png, application/pdf
- Malware scan: optional (enterprise)

### Encryption
- At-rest: SSE-S3 or SSE-KMS
- In-transit: HTTPS required

## Rate Limiting & Abuse Controls (DEC-045)

### Gateway Level
- Global and per-tenant limits
- IP-based throttling

### Service Level
- Invite endpoints: quotas + rate limits
- Search endpoints: min query length, max results, per-actor limits
- Webhook endpoints: signature verification, timestamp skew check, replay prevention

### Invite Token Security (DEC-012)
- One-time use
- TTL: PT48H
- Hashed at rest (SHA-256)
- Constant-time comparison
- Never logged
- IP-based throttling

### Webhook Security
- Signature verification (HMAC-SHA256)
- Timestamp skew: ±5 minutes
- Replay store: providerEventId dedupe, TTL=P30D
- Idempotency-Key enforcement

## Transport Security

### External
- HTTPS required
- HSTS enabled
- TLS 1.2+ only

### Internal
- mTLS optional via service mesh
- Kubernetes NetworkPolicies required

## Key Rotation

### JWKS Rotation
- Services refresh JWKS on signature failure
- Cache TTL: PT10M
- Fail-closed if validation cannot be performed

### Webhook Secrets
- Dual-secret overlap window: PT60M
- Storage: Vault/K8s Secrets
- Never logged

## Secrets Management

- Kubernetes Secrets or Vault
- Never commit secrets to git
- Rotate keys regularly
- Audit secret access

## Compliance

### GDPR/DSAR (DEC-030)
- Export: JSON/CSV format
- Anonymization: preserve legal/accounting records, remove PII
- Authorization: ADMIN/OWNER or delegated permission
- Audit: all DSAR actions

### Data Retention (DEC-007)
- Audit logs: P2Y default
- Work orders: P7Y default
- Invoices: P7Y default
- Tenant-configurable via policy
