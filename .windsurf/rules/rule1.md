[ROLE]
You are a principal full-stack engineer + DevOps engineer + staff architect. Generate a complete, runnable, production-grade monorepo implementing the AutoRepairShop Management System.

[SINGLE SOURCE OF TRUTH]
The Blueprint JSON appended at the end of this prompt (between <<<BLUEPRINT_JSON_START>>> and <<<BLUEPRINT_JSON_END>>>) is authoritative for:
- scope, architecture, domain rules, security, tenancy, policies, entities, validations
- API standards, event contracts, state machines, observability, CI/CD, abuse controls, data classification, runbooks
Implement it exactly.

MISSING RULES POLICY:
- Do NOT invent domain rules. If something is missing or ambiguous, choose the SAFEST default:
  - Security: deny-by-default
  - Finance: conservative
  - Privacy/PII: minimize exposure
- Record every such decision as DEC-NEW-### in docs/DECISIONS.md with rationale.
- Implement consistently across code, API, UI, tests, and docs.

[STRICT OUTPUT FORMAT — NO EXTRA TEXT]
Output ONLY repository contents (no explanations).
1) Print a repository file tree.
2) Then print every file using EXACT delimiters:
BEGIN_FILE: <relative/path>
<file contents>
END_FILE
No omissions. No TODO placeholders. If optional, implement safe minimal version.

[STACK — FIXED]
- Monorepo build: Maven multi-module + Maven Wrapper (./mvnw).
- Frontend: React + TypeScript (Vite), mobile-first, i18next (en+tr), minimum-mode UX first.
- Backend: Java 17+ Spring Boot 3.x microservices, Spring Security Resource Server (JWT RS256), Spring Cloud Gateway.
- DB: PostgreSQL + Flyway per service (deterministic migrations).
- Eventing: Kafka preferred + Outbox + consumer dedupe (RabbitMQ only if Blueprint explicitly requires).
- Auth: Keycloak OIDC (realm export included); service-to-service client credentials per Blueprint.
- Observability: OpenTelemetry + Micrometer + Prometheus + Grafana; structured logs with PII masking/redaction.
- Local dev: docker-compose runs EVERYTHING.
- Kubernetes: manifests (base + overlays/dev) to deploy EVERYTHING.
- OpenAPI: springdoc per service + exported YAML under docs/openapi/.
- CI: GitHub Actions (build + tests + container images).

[REQUIRED REPO STRUCTURE]
/
  README.md
  docs/
    ARCHITECTURE.md
    RUNBOOK.md
    SECURITY.md
    DECISIONS.md
    API_GUIDE.md
    UX_MINIMUM_MODE.md
  infra/
    docker-compose.yml
    keycloak/
      realm-export.json
    observability/
      otel-collector-config.yml
      prometheus.yml
      grafana/ (datasources + dashboards provisioning)
    k8s/
      base/
      overlays/
        dev/
  scripts/
    dev-up.sh
    dev-down.sh
    wait-for.sh
  frontend/
  libs/
    common-security/
    common-error/
    common-idempotency/
    common-outbox/
    common-events/
    common-pii/
    common-etag/
  services/
    gateway-service/
    tenantadmin-service/
    customer-service/
    vehicle-service/
    workorder-service/
    inventory-service/
    payment-service/
    appointment-service/
    file-service/
    audit-service/
    notification-service/
    query-bff-service/

[PORTS — FIXED]
gateway 8080
tenantadmin 8081
customer 8082
vehicle 8083
workorder 8084
inventory 8085
payment 8086
appointment 8087
file 8088
audit 8089
notification 8090
query-bff 8091
frontend 5173 (dev)

[LOCAL DEV — DATABASES]
Use ONE Postgres container with multiple DBs (simple local dev). Create:
tenantadmin_db, customer_db, vehicle_db, workorder_db, inventory_db, payment_db, appointment_db, file_db, audit_db, notification_db
(BFF must be stateless; only add bff_db if Blueprint requires persisted read-model.)

[BACKEND — NON-NEGOTIABLE ENGINEERING RULES]
Apply to EVERY service:
- Strict layering: Controller → Service → Repository. No business logic in controllers.
- DTOs with Bean Validation annotations; mapstruct for mapping; global exception handler implementing Blueprint error model.
- Tenancy & branch scoping:
  - tenant_id claim required (403 if missing).
  - branch_id enforced when policy requires (403 if missing).
  - JWT claims are authoritative; gateway headers are NOT authoritative.
  - Membership verification via TenantAdmin + short TTL cache; fail-closed.
- Authorization:
  - Deny-by-default. If no explicit permission mapping exists, return 403.
  - Implement RBAC + permissions + policy evaluation order/precedence as in Blueprint.
- Idempotency:
  - Implement Idempotency-Key for required endpoints (create operations, fast intake, payments, webhooks, etc.).
  - Same key + different payload => 409.
  - Persist idempotency records (DB; Redis only if Blueprint allows).
- Optimistic concurrency:
  - Use ETag on GET, If-Match on update endpoints as Blueprint requires.
  - Missing If-Match where required => 428.
- Soft delete:
  - Include is_deleted + common fields; repositories exclude deleted rows by default.
  - Partial unique indexes to enforce uniqueness only on active rows.
- Eventing:
  - Outbox pattern: OutboxEvent table + publisher worker.
  - Consumers: ProcessedEvent dedupe store.
  - Topic naming per Blueprint conventions (e.g., *.events.v1).
  - DLQ + replay runbook; provide scripts if needed.
- Logging/PII:
  - Never log raw PII; apply masking/redaction utilities globally.
  - Follow Blueprint DataClassification and AbuseControls.
- Resilience:
  - Timeouts for all outbound calls.
  - Retries only for idempotent operations.
  - Circuit breakers + bulkheads where relevant (Resilience4j).
- Tests:
  - Unit tests: validators, plate normalization, state machines, idempotency, policy precedence, membership fail-closed.
  - Integration tests: Testcontainers Postgres; Kafka where feasible.
  - Smoke tests: key endpoints.
- OpenAPI:
  - Each service exposes /v3/api-docs and /swagger-ui.
  - Export YAML snapshots under docs/openapi/ (generated or curated, but must exist).
- Configuration:
  - 12-factor env vars. No real secrets committed.
  - Provide sane defaults for local dev via docker-compose env.

[FRONTEND — NON-NEGOTIABLE RULES]
- React+TS (Vite), i18next (en+tr), mobile-first, accessible, “minimum mode” first.
- Auth: OIDC PKCE with Keycloak; avoid localStorage for access tokens; implement refresh strategy safely.
- API client:
  - typed client, correlation/request IDs, errorCode mapping, pagination helpers, ETag/If-Match helpers, idempotency header support.
- Screens (minimum deliverable):
  - Login
  - Fast Intake (single screen): plate lookup/create vehicle + create guest customer + create workorder draft (idempotent)
  - WorkOrders: list + detail + status change (state machine guarded)
  - Customers: list + detail (masked by default; full PII only with permission)
  - Vehicles: lookup by plate
  - Invoices/Payments: issue invoice + “cash payment received” (offline/cash marking)
  - Admin (minimum): branches, roles/permissions, policies (simulate + publish)
- Minimum mode UX:
  - Advanced fields hidden by default (progressive disclosure).
  - Big touch targets, simple copy, step-by-step flow.
- Optional: PWA offline draft per Blueprint (if enabled/required): store drafts (IndexedDB), sync on reconnect using Idempotency-Key.

[SERVICE RESPONSIBILITIES — MUST MATCH BLUEPRINT]
Generate these services with clear boundaries and contracts:
- gateway-service: routing, CORS allowlist, security headers, correlation IDs, coarse rate limiting (services still enforce authz).
- tenantadmin-service: tenants/branches/memberships/roles/policies + policy simulate/publish + membership verification API.
- customer-service: guest + registered, invites, dedupe/link/merge/unmerge, DSAR export/anonymize, redirect resolution.
- vehicle-service: plate normalization, uniqueness per policy, ownership history.
- workorder-service: work orders + state machine + fast intake endpoint + saga commands/events.
- inventory-service: stock ledger, reservations/consumption/return + saga events.
- payment-service: invoice + immutable-after-issued, payment ledger, cash marking, optional online initiation + webhooks.
- appointment-service: business hours, appointments, check-in, optional link to work order.
- file-service: MinIO presign upload/download + attachment metadata.
- audit-service: append-only audit log; tamper-evident chain if required; always record critical actions.
- notification-service: templates, channels, pull model for PII (fetch as needed), quiet hours if required.
- query-bff-service: UI-optimized composite read endpoints; masking by default.

[REQUIRED “ONE COMMAND” EXPERIENCE]
Provide:
- scripts/dev-up.sh: starts docker-compose + waits for readiness + prints URLs/credentials.
- scripts/dev-down.sh: stops stack.
- README.md: exact commands:
  - start local stack
  - run backend tests
  - run frontend
  - build all
  - where to open UI and Swagger
Also provide a default dev tenant/branch/admin user documented (created via migrations/seed or startup dev initializer).

[KEYCLOAK REALM — REQUIRED]
In infra/keycloak/realm-export.json include:
- realm: autorepairshop (or per Blueprint)
- clients:
  - frontend (public, PKCE)
  - gateway-service (confidential)
  - svc-<service> (confidential, service accounts enabled) for client-credentials calls
- roles/scopes/claims mapping as Blueprint requires (tenant_id, branch_id, permissions).
Document how to log in locally.

[DO NOT SKIP]
- Flyway migrations for every service: baseline schema + indexes + idempotency/outbox/processed-event tables where needed.
- Global error model + error code catalog per Blueprint.
- Correlation/request IDs end-to-end.
- Masking/redaction: prove via code + tests.
- Event outbox publisher: runnable.
- Dedupe consumer: runnable.
- K8s manifests: runnable (dev overlay).
- docker-compose: runnable.

[BEGIN GENERATION]
Generate the full monorepo now.

<<<BLUEPRINT_JSON_START>>>
{
  "blueprintVersion": "1.2",
  "generatedAtUtc": "2026-01-11T00:00:00Z",
  "promptPurpose": {
    "title": "Authoritative System Blueprint Prompt (AutoRepairShop Management System)",
    "instructionToAI": [
      "Treat this JSON as the single source of truth for scope, architecture, domain rules, security, data model, APIs, event contracts, UX principles, and operational runbooks.",
      "Do not invent missing rules; if a rule is missing, propose a safe default AND add it to this blueprint output as an explicit decision (DEC-XXX).",
      "Design for progressive onboarding: the system must be usable by low digital-literacy mechanics while also supporting multi-branch enterprise operations.",
      "Maintain strict separation of concerns (Controller → Service → Repository), SOLID, DTO validation, authentication/authorization, and global exception handling.",
      "Never log sensitive data. Mask/minimize PII in logs. Enforce idempotency where specified.",
      "All timestamps stored in UTC; UI displays by locale/timezone.",
      "Default security posture is deny-by-default: if permission/policy is unclear or missing for protected operations, fail closed."
    ]
  },
  "explicitDecisions": {
    "decisionLog": [
      {
        "id": "DEC-001",
        "title": "JWT Claims Standard for Tenant/Branch Scoping",
        "decision": "All services treat JWT claims as authoritative for tenant/branch scope; gateway headers may assist but are not authoritative.",
        "details": {
          "requiredClaims": ["sub", "tenant_id"],
          "optionalClaims": ["branch_id", "roles", "scope", "locale"],
          "validationRules": [
            "If tenant_id claim is missing: return 403 Forbidden.",
            "If branch mode is enforced by tenant policy and branch_id claim is missing: return 403 Forbidden.",
            "Services must verify (tenant_id, branch_id) membership via TenantAdminService membership cache with short TTL for near-real-time revocation."
          ]
        }
      },
      {
        "id": "DEC-002",
        "title": "Policy Storage, Versioning, and Publishing",
        "decision": "Tenant policies are versioned, publishable, and auditable. Policy changes are forward-looking; historical snapshots remain unchanged.",
        "details": {
          "policyVersioning": {
            "policyVersion": "Monotonic integer per tenant and per policy category",
            "effectiveFrom": "UTC timestamp",
            "scope": "TENANT or BRANCH override",
            "rollback": "Rollback is allowed by publishing a prior version as current; all publishes are audited."
          },
          "distribution": "On publish, emit PolicyUpdated event; services invalidate policy cache."
        }
      },
      {
        "id": "DEC-003",
        "title": "Customer Merge Reversibility Clarification",
        "decision": "Customer merge is not a guaranteed hard-undo; it supports an admin-only compensating 'unmerge' operation that is tool-assisted and audited.",
        "details": [
          "Merge records keep a deterministic merge plan describing field-level precedence and moved references.",
          "CustomerRedirect records remain to prevent broken references; consumers resolve redirects.",
          "Unmerge may restore source customer to ACTIVE and re-link identity; reference rewrites are optional and may require manual confirmation per tenant policy."
        ]
      },
      {
        "id": "DEC-004",
        "title": "Idempotency Key Replay Safety",
        "decision": "Idempotency-Key reuse with different payload is rejected to prevent accidental duplication or tampering.",
        "details": {
          "rules": [
            "Store requestHash and response snapshot per (tenantId, idempotencyKey).",
            "If same key arrives with a different requestHash: return 409 Conflict.",
            "If same key arrives with same requestHash: return the stored response (status + body)."
          ],
          "defaultTTLs": {
            "fastIntakeCreate": "PT24H",
            "partsReservationRequests": "PT24H",
            "paymentInitiation": "P7D",
            "paymentWebhooks": "P30D"
          }
        }
      },
      {
        "id": "DEC-005",
        "title": "Custom Status Boundaries and Reporting Canonicalization",
        "decision": "Tenants may add sub-statuses mapped to canonical statuses; reporting uses canonical statuses.",
        "details": {
          "rule": "Custom statuses are allowed only as sub-statuses under a canonical status category (e.g., IN_PROGRESS -> WAITING_PARTS).",
          "requiredMapping": "Every custom status must map to a canonical status for dashboards, SLAs, and analytics."
        }
      },
      {
        "id": "DEC-006",
        "title": "API Versioning and Deprecation Policy",
        "decision": "REST endpoints are versioned by URL prefix; breaking changes require a new major version.",
        "details": {
          "versioning": "Use /v1, /v2 prefixes (e.g., /v1/workorders).",
          "deprecation": "Minimum 6 months deprecation window for major versions; publish deprecation headers; monitor usage via telemetry."
        }
      },
      {
        "id": "DEC-007",
        "title": "Data Retention, Export, and Anonymization Baseline",
        "decision": "Default retention and anonymization policies are defined and tenant-configurable.",
        "details": {
          "defaults": {
            "auditRetention": "P2Y",
            "workOrderRetention": "P7Y",
            "invoiceRetention": "P7Y"
          },
          "privacy": [
            "Hard delete is disabled by default; use soft delete and/or anonymization.",
            "If customer requests deletion: anonymize customer PII while preserving work orders/invoices for legal/accounting retention."
          ]
        }
      },
      {
        "id": "DEC-008",
        "title": "Policy Resolve Precedence and Fail-Safe Behavior",
        "decision": "Policy evaluation order is BRANCH override (if present) then TENANT baseline, then DEFAULTS. Missing/invalid policy results in fail-closed for protected transitions and fail-open for non-critical UX hints, per category rules.",
        "details": {
          "precedence": ["BRANCH", "TENANT", "DEFAULTS"],
          "categoryFailSafe": {
            "REQUIRED_FIELDS": "FAIL_CLOSED",
            "WORKORDER_WORKFLOW": "FAIL_CLOSED",
            "PAYMENT_RULES": "FAIL_CLOSED",
            "FIELD_VISIBILITY": "FAIL_OPEN",
            "DATA_RETENTION": "FAIL_CLOSED",
            "PERMISSIONS": "FAIL_CLOSED",
            "APPOINTMENT_RULES": "FAIL_CLOSED",
            "SEARCH_LIMITS": "FAIL_CLOSED",
            "FILE_SECURITY": "FAIL_CLOSED",
            "PRICING_TAX_RULES": "FAIL_CLOSED",
            "NOTIFICATION_RULES": "FAIL_OPEN",
            "APPROVAL_RULES": "FAIL_CLOSED",
            "UI_SIMPLICITY_MODE": "FAIL_OPEN"
          },
          "effectiveFromHandling": "Services switch policy based on effectiveFrom (UTC). If PolicyUpdated is received late, services must still apply policy by effectiveFrom timestamp.",
          "conflictResolutionRule": "If the same field/rule is defined both at BRANCH and TENANT scope, BRANCH wins. Undefined at BRANCH falls back to TENANT."
        }
      },
      {
        "id": "DEC-009",
        "title": "Soft Delete + Uniqueness Strategy",
        "decision": "Uniqueness constraints ignore soft-deleted rows using partial unique indexes (PostgreSQL) or equivalent per DB. Restoring a deleted record requires conflict checks.",
        "details": {
          "postgresExample": "CREATE UNIQUE INDEX ... WHERE is_deleted = false",
          "restoreRule": "If restore conflicts with an active record, return 409 and require manual resolution."
        }
      },
      {
        "id": "DEC-010",
        "title": "Event Partitioning and Ordering Expectations",
        "decision": "Event partition key is tenantId + aggregateId (e.g., workOrderId). Ordering is expected per aggregate within a partition; consumers must tolerate duplicates and out-of-order across aggregates.",
        "details": {
          "kafkaPartitionKey": "tenantId:aggregateId",
          "orderingGuarantee": "Per aggregate only",
          "consumerRule": "Consumers must be idempotent and track processed eventId per consumerGroup. If events arrive out of order for the same aggregate, consumer must buffer up to a small window or apply last-write-wins where safe."
        }
      },
      {
        "id": "DEC-011",
        "title": "Idempotency Response Snapshot Minimization",
        "decision": "Idempotency stores only minimal safe response data. Storing PII fields in idempotency response is forbidden.",
        "details": {
          "allowedResponseFields": ["resourceId", "status", "location", "createdAt"],
          "forbidden": ["fullName", "phoneE164", "emailNormalized", "notes", "address", "paymentDetails", "cardData", "authHeaders", "tokens"]
        }
      },
      {
        "id": "DEC-012",
        "title": "Invite Token Security Model",
        "decision": "Invites use one-time tokens with TTL and replay prevention. Tokens are hashed at rest; validation is constant-time. Invite accept flow is rate limited and audited.",
        "details": {
          "ttl": "PT48H",
          "oneTimeUse": true,
          "storage": "Store tokenHash + consumedAt + issuedAt + issuedByUserId + targetCustomerId + channel + ipHash (optional)",
          "abuseControls": ["IP-based throttling at gateway", "per-tenant quotas", "audit every attempt including failures"],
          "tokenFormat": "Opaque random token; never include PII; transmitted only via secure channels; must not be logged."
        }
      },
      {
        "id": "DEC-013",
        "title": "Invoice Numbering and Immutability",
        "decision": "Invoice has a tenant-scoped sequential human-readable number; invoice monetary snapshot becomes immutable after ISSUED.",
        "details": {
          "numberFormatDefault": "INV-{branchCode}-{yyyy}-{sequence}",
          "immutability": "After status=ISSUED, amountTotal/currency/tax snapshot cannot change; corrections occur via credit note (optional future) or reversal/refund transactions."
        }
      },
      {
        "id": "DEC-014",
        "title": "Authorization Failure Auditing Volume Control",
        "decision": "Authorization failures (403) are auditable but controlled to avoid log floods. Default is sampled and rate-limited per tenant, while still capturing enough for forensics.",
        "details": {
          "defaultBehavior": "Rate-limit 403 audit events per tenant and per actor (e.g., max 60/min) with aggregation summaries.",
          "enterpriseOption": "Enterprise tenants may choose full capture for 403 via policy (with higher retention/cost).",
          "alwaysCapture": [
            "Customer merge/link/unmerge attempts",
            "Policy publish attempts",
            "Role/permission changes",
            "Payment/refund endpoints",
            "File presign issuance endpoints",
            "DSAR export/anonymization actions"
          ]
        }
      },
      {
        "id": "DEC-015",
        "title": "Membership Validation Timeout and Fallback",
        "decision": "Services call TenantAdminService membership validation with strict timeouts. If unreachable, services may use short-lived cached membership; cache miss is fail-closed.",
        "details": {
          "timeouts": { "connect": "PT0.2S", "read": "PT0.5S" },
          "cacheTtlDefault": "PT2M",
          "fallbackRules": [
            "If cache hit within TTL: allow/deny based on cached membership.",
            "If cache miss: deny (403) for protected operations.",
            "Read-only endpoints may be configured (policy) to allow 'stale-if-error' for a very short grace window (default OFF)."
          ]
        }
      },
      {
        "id": "DEC-016",
        "title": "Notification PII Pull Model",
        "decision": "Domain events do not carry PII by default. NotificationService pulls required customer contact data via permissioned APIs when sending messages.",
        "details": {
          "defaultEventContent": "IDs only (customerId, invoiceId, workOrderId).",
          "notificationFetch": "NotificationService calls CustomerService to fetch contact channels when needed, subject to permissions and tenant policy.",
          "piiMinimization": "If policy requires embedding minimal PII, it must be masked and strictly limited to deliverability needs."
        }
      },
      {
        "id": "DEC-017",
        "title": "Appointment Capacity and Business Hours Policy Baseline",
        "decision": "Appointment availability is driven by branch business hours and capacity rules. Default is simple capacity per time slot with optional mechanic-level schedules later.",
        "details": {
          "defaultSlotSize": "PT30M",
          "defaultCapacityModel": "capacityPerSlot per branch (integer), with holiday/closure exceptions",
          "noShowPolicyDefault": "Mark NO_SHOW after 15 minutes grace; configurable by tenant policy",
          "dataModel": "Store BusinessHours + Exceptions per branch; AppointmentService enforces booking rules"
        }
      },
      {
        "id": "DEC-018",
        "title": "BFF PII Masking by Default",
        "decision": "QueryBFFService responses must mask PII by default. Full PII requires explicit permission and dedicated endpoints.",
        "details": {
          "defaultMasking": "Return masked phone/email and optionally masked name depending on tenant policy.",
          "fullDetailPermission": "CUSTOMER_PII_READ required to access unmasked customer contact data via BFF."
        }
      },
      {
        "id": "DEC-019",
        "title": "Authorization Evaluation Order and Deny-by-Default",
        "decision": "Authorization is evaluated in a fixed order and defaults to deny for protected operations if any dependency is unavailable or policy/permission is missing.",
        "details": {
          "evaluationOrder": [
            "Authenticate JWT (signature, exp, iss, aud) as resource server",
            "Extract tenant_id/branch_id/sub from JWT",
            "Membership validation (TenantAdminService cache with DEC-015 fallback)",
            "Scope checks (tenant isolation + optional branch isolation)",
            "Ownership checks (for customer self-service and restricted resources)",
            "Permission checks (RBAC defaults + runtime permission overrides)",
            "Policy checks (required fields, workflow, payment rules, file rules)",
            "Rate limits / abuse controls (if applicable)"
          ],
          "denyRules": [
            "If membership validation cache miss and service unreachable: deny protected operations",
            "If required permission mapping for endpoint is missing: deny"
          ]
        }
      },
      {
        "id": "DEC-020",
        "title": "Branch Enforcement Migration Policy",
        "decision": "When a tenant enables mandatory branch mode, data migration is required for branchId-null records. The system provides a migration tool; access is restricted until migration completes.",
        "details": {
          "defaultBehavior": "FAIL_CLOSED for branch-scoped reads/writes when branchRequired=true and target record.branchId is null.",
          "migrationOptions": [
            "Option A (default): Admin assigns legacy branchId-null records to a chosen branch via a migration job/tool.",
            "Option B (enterprise): Assign a default branch automatically (policy-controlled) and audit all assignments."
          ],
          "auditing": [
            "Record migration actions in AuditService with counts and actorUserId",
            "Keep migration batch id for forensics"
          ]
        }
      },
      {
        "id": "DEC-021",
        "title": "Vehicle Ownership Model and Minimum-Mode Handling",
        "decision": "A Vehicle always belongs to exactly one Customer (customerId required). In minimum mode, the system auto-creates a Guest customer if the user attempts to create a Vehicle without selecting an existing customer.",
        "details": {
          "constraints": [
            "Vehicle.customerId is required",
            "Vehicle ownership transfer is audited and creates a history record"
          ],
          "fleetFutureExtension": "Fleet support is future: introduce OrganizationCustomer (or FleetAccount) and allow Vehicles to be owned by an organization; not in MVP."
        }
      },
      {
        "id": "DEC-022",
        "title": "Invoice Creation Trigger and Completion Rules",
        "decision": "Invoices are optional by default. Tenants may enable automatic invoice creation on work order completion via policy; minimum-mode defaults to manual/no-invoice.",
        "details": {
          "defaults": {
            "autoCreateInvoiceOnComplete": false,
            "requireInvoiceBeforeComplete": false
          },
          "enterprisePolicyOptions": [
            "autoCreateInvoiceOnComplete=true",
            "requireInvoiceBeforeComplete=true (FAIL_CLOSED completion transition if missing)"
          ],
          "workOrderWithoutInvoice": "Allowed and reportable; financial KPIs exclude those work orders by default (configurable)."
        }
      },
      {
        "id": "DEC-023",
        "title": "Policy Category Schemas and Strict Validation",
        "decision": "Each policy category has a concrete JSON schema and defaults. Unknown fields are rejected when strictValidation=true. strictValidation defaults to true for enterprise tenants.",
        "details": {
          "strictValidationDefaults": {
            "soloSmallShop": false,
            "smb": true,
            "enterprise": true
          },
          "validationFailure": "Return 400 with errorCode=ERR_POLICY_INVALID_SCHEMA and field-level details."
        }
      },
      {
        "id": "DEC-024",
        "title": "Event Serialization, Schema Governance, and Compatibility",
        "decision": "Kafka is preferred with a schema registry. Events use JSON Schema with backward compatibility rules; RabbitMQ alternative must follow identical payload contracts.",
        "details": {
          "serialization": "JSON",
          "schemaRegistry": "Required in Kafka deployments (e.g., Apicurio/Confluent).",
          "compatibility": "BACKWARD (consumers must ignore unknown fields). Breaking changes require new topic version (v2) or new eventType.",
          "dlqContract": {
            "envelope": ["originalTopic", "consumerGroup", "failureType", "failureMessage", "failedAt", "retryCount", "originalEventEnvelope"],
            "replayRule": "Replay uses the same eventId; consumers must be idempotent."
          }
        }
      },
      {
        "id": "DEC-025",
        "title": "Idempotency Atomicity and Request Hashing",
        "decision": "Idempotency is enforced atomically via a unique constraint and an upsert strategy. requestHash is SHA-256 of canonical JSON payload + endpoint identifier.",
        "details": {
          "uniqueness": "unique(tenantId, idempotencyKey, endpointKey)",
          "canonicalization": [
            "Sort JSON object keys recursively",
            "Normalize whitespace",
            "Exclude volatile headers except Idempotency-Key and Content-Type"
          ],
          "concurrencyHandling": [
            "First writer wins: create record with requestHash",
            "Concurrent request with same key: read existing record and apply DEC-004 rules"
          ],
          "cleanup": "A scheduled job deletes expired idempotency records; deletes are audited in aggregate only (no PII)."
        }
      },
      {
        "id": "DEC-026",
        "title": "File Presign Security Baseline",
        "decision": "File uploads/downloads use pre-signed URLs with strict allowlists, size limits, and owner-binding validation. Unauthorized access is fail-closed.",
        "details": {
          "storage": "S3-compatible object storage (AWS S3/MinIO).",
          "presignDefaults": {
            "uploadTtl": "PT10M",
            "downloadTtl": "PT10M",
            "maxSizeBytesDefault": 25000000,
            "allowedContentTypesDefault": ["image/jpeg", "image/png", "application/pdf"]
          },
          "ownerBinding": [
            "FileAttachment.ownerType + ownerId must be validated before issuing presign",
            "Uploader must have permission FILES_MANAGE or own the resource (customer self-service rules apply)"
          ],
          "malwareScan": {
            "enabledByDefault": false,
            "enterpriseOption": "Async scan pipeline: mark file as QUARANTINED until clean"
          }
        }
      },
      {
        "id": "DEC-027",
        "title": "Error Code Catalog is Mandatory",
        "decision": "All services must use a shared stable error code catalog; clients must not rely on raw messages.",
        "details": {
          "rule": "Every non-2xx response includes errorCode and errorId",
          "localization": "message is localized using messageKey + args"
        }
      },
      {
        "id": "DEC-028",
        "title": "Search Safety and Abuse Controls",
        "decision": "Search endpoints (plate, customer) are rate-limited and require minimum query length; enterprise tenants may enable stricter limits.",
        "details": {
          "defaults": {
            "minPlateQueryLength": 2,
            "minCustomerQueryLength": 2,
            "maxResults": 20,
            "rateLimitPerActorPerMinute": 120
          },
          "piiSearch": "Searching by phone/email requires CUSTOMER_PII_READ; results are masked unless permission grants full read."
        }
      },
      {
        "id": "DEC-029",
        "title": "Invoice Numbering Strategy for Distributed Databases",
        "decision": "In Postgres, invoice sequence can be gapless per tenant+branch. In distributed DBs, uniqueness and monotonicity are guaranteed but gapless is not guaranteed.",
        "details": {
          "postgres": "DB sequence per tenant+branch; transactionally assign at ISSUED time",
          "distributedDb": "Use a numbering service with monotonic IDs; allow gaps; audit assignments"
        }
      },
      {
        "id": "DEC-030",
        "title": "DSAR (Data Subject Access Request) Support Baseline",
        "decision": "System supports export and anonymization workflows for customer data requests, subject to tenant policy and legal retention rules.",
        "details": {
          "actions": ["EXPORT", "ANONYMIZE"],
          "exportFormat": ["JSON", "CSV (optional)"],
          "authorization": "ADMIN/OWNER or delegated permission required; action audited",
          "retention": "Anonymization preserves accounting/legal records while removing PII"
        }
      },
      {
        "id": "DEC-031",
        "title": "Operational SLO Defaults",
        "decision": "Baseline SLOs are defined; tenants and environments may override targets but monitoring must exist from day one.",
        "details": {
          "apiSlo": { "p95Latency": "PT0.5S", "p99Latency": "PT1.5S", "availabilityMonthly": "99.9%" },
          "eventingSlo": { "p95EndToEndLag": "PT30S", "dlqRate": "Less than 0.1% of messages" }
        }
      },
      {
        "id": "DEC-032",
        "title": "Audit Log Tamper-Evident Integrity",
        "decision": "Audit logs are append-only and tamper-evident. Default is hash-chain per tenant; optional WORM storage for enterprise.",
        "details": {
          "hashChain": {
            "perTenant": true,
            "fields": ["auditLogId", "occurredAt", "actorUserId", "eventType", "tenantId", "branchId", "resourceType", "resourceId", "summary", "metadataCanonicalJson", "prevHash"],
            "hashAlgorithm": "SHA-256",
            "metadataCanonicalization": ["Sort JSON keys recursively", "Normalize whitespace", "Redact/omit secrets/PII"],
            "verification": "Nightly integrity verification job per tenant; alerts on mismatch"
          },
          "wormOption": {
            "supported": true,
            "examples": ["S3 Object Lock (compliance mode)", "WORM-capable storage policies"],
            "note": "WORM is optional and policy-driven; still keep hash-chain to detect tampering in non-WORM storage."
          }
        }
      },
      {
        "id": "DEC-033",
        "title": "WorkOrder/Invoice Line Item Model (Progressive)",
        "decision": "Line items exist as first-class entities but remain optional in minimum mode. Enterprise tenants may enforce line item completeness via policy.",
        "details": {
          "entities": ["WorkOrderLaborItem", "WorkOrderPartItem", "InvoiceLineItem"],
          "immutability": [
            "InvoiceLineItem snapshot is immutable once invoice.status=ISSUED",
            "WorkOrderPartItem captures both inventoryPartId and unit price snapshot at the time of consumption/reservation"
          ],
          "policyEnforcement": "REQUIRED_FIELDS and PRICING_TAX_RULES can require at least one line item before COMPLETED/ISSUED."
        }
      },
      {
        "id": "DEC-034",
        "title": "Plate Normalization Canonical Algorithm",
        "decision": "Plate uniqueness and searches use a canonical normalization algorithm that is deterministic and locale-safe. rawPlate is preserved for display.",
        "details": {
          "canonicalAlgorithm": [
            "Trim",
            "Convert to uppercase using Locale.ROOT (not tr-TR) to avoid Turkish I/İ issues",
            "Remove spaces, hyphens, dots",
            "Allow only [A-Z0-9]; drop other characters",
            "Enforce length 2..16; otherwise validation error"
          ],
          "fields": {
            "rawPlate": "User-entered, preserved",
            "normalizedPlate": "Derived, used for uniqueness + search"
          },
          "uniqueness": "Default unique(tenantId, normalizedPlate) with soft-delete awareness (DEC-009); branch-level uniqueness is optional by policy."
        }
      },
      {
        "id": "DEC-035",
        "title": "Policy Simulation and Canary Publish",
        "decision": "Policy publishing supports dry-run simulation and canary rollout (branch-scoped) before tenant-wide activation to reduce operational risk.",
        "details": {
          "simulation": [
            "Validate JSON schema strictly (DEC-023)",
            "Compute diff vs current policy",
            "Generate impact report: affected endpoints, required fields changes, workflow transitions changes, pricing/tax changes"
          ],
          "canaryPublish": {
            "supported": true,
            "default": "Branch canary required for enterprise tenants; optional for SMB",
            "rolloutSteps": [
              "Publish to 1..N canary branches with effectiveFrom in the near future",
              "Observe errors/latency/authorization failures",
              "Promote to tenant baseline or rollback by republishing prior version"
            ]
          }
        }
      },
      {
        "id": "DEC-036",
        "title": "API Concurrency Standard (Optimistic Locking via ETag/If-Match)",
        "decision": "Write endpoints must enforce optimistic concurrency using versioned ETags or an explicit version field. Stale writes are rejected.",
        "details": {
          "defaultMechanism": "ETag + If-Match",
          "etagFormat": "W/\"{version}\"",
          "rules": [
            "GET returns ETag",
            "PUT/PATCH requires If-Match for mutable resources (WorkOrder, Vehicle, Customer, Invoice, PartsReservation)",
            "If-Match missing on protected mutable endpoints: 428 Precondition Required (fail-closed) except for explicitly allowed fast-intake endpoints",
            "Version mismatch: 409 ERR_RESOURCE_CONFLICT"
          ],
          "exceptions": [
            "POST create endpoints do not require If-Match",
            "Idempotent POST endpoints (with Idempotency-Key) can omit If-Match"
          ]
        }
      },
      {
        "id": "DEC-037",
        "title": "WorkOrder–Inventory Saga Contract (Reservation → Consumption → Return)",
        "decision": "WorkOrder and Inventory are coordinated via an event-driven saga (choreography). Consumers are idempotent, and compensating actions are defined.",
        "details": {
          "phases": [
            "Reservation: reserve stock for a work order (optional in minimum mode)",
            "Consumption: convert reserved to consumed (e.g., when mechanic installs part)",
            "Return: return unused parts (reserved or consumed correction) to inventory"
          ],
          "events": [
            "PartsReservationRequested",
            "PartsReserved",
            "PartsReservationRejected",
            "PartsConsumptionRecorded",
            "PartsReturnRecorded",
            "PartsReservationCanceled"
          ],
          "timeoutAndCompensation": [
            "If reservation is rejected: WorkOrder may move to subStatus WAITING_PARTS or requires staff intervention per policy",
            "If work order is canceled: emit PartsReservationCanceled (if any active reservations exist)",
            "If consumption recorded for insufficient stock: Inventory emits rejection; WorkOrder flags inconsistency for admin review"
          ],
          "idempotency": [
            "All saga commands include idempotencyKey and correlationId",
            "Consumers store processed events in ProcessedEvent (DEC-010) and dedupe by (tenantId, eventId, consumerGroup)"
          ]
        }
      },
      {
        "id": "DEC-038",
        "title": "Service-to-Service Authentication and Authorization Baseline",
        "decision": "All internal service-to-service calls require machine identity (client credentials) with explicit audience and least-privilege scopes; mTLS is optional but supported.",
        "details": {
          "preferred": "OIDC Client Credentials",
          "tokenRequirements": [
            "aud must match the target service",
            "scope must include required service scope (e.g., tenantadmin.membership.read)",
            "short-lived tokens; no reuse across environments"
          ],
          "transport": {
            "external": "HTTPS required",
            "internal": "mTLS optional via service mesh; NetworkPolicies required in Kubernetes"
          },
          "denyByDefault": "If internal auth is missing or invalid, return 403 ERR_AUTH_FORBIDDEN."
        }
      },
      {
        "id": "DEC-039",
        "title": "Customer Redirect Resolution Standard",
        "decision": "Merged customer references must resolve consistently across services. Redirect resolution occurs in the service layer with bounded recursion and caching.",
        "details": {
          "resolutionRules": [
            "If a customerId is MERGED, resolve to active target via CustomerRedirect",
            "Max redirect hops: 3; beyond that treat as ERR_RESOURCE_CONFLICT and require admin fix",
            "Provide explicit API option resolveRedirects=true/false for admin tooling; default true for UI endpoints"
          ],
          "caching": {
            "cacheTtl": "PT5M",
            "invalidation": "Invalidate on CustomerMerged/CustomerUnmerged events"
          }
        }
      },
      {
        "id": "DEC-040",
        "title": "Identity & User Lifecycle Baseline (Staff + Customer + Machine)",
        "decision": "Identity is centralized in the IdP (Keycloak preferred) while application-level authorization is enforced in services using tenant-scoped RBAC + permissions. User provisioning and account lifecycle are standardized to avoid divergent behaviors across services.",
        "details": {
          "identityProviderAssumptions": {
            "preferred": "Keycloak (OIDC)",
            "tokenType": "JWT access token (RS256), short-lived",
            "realmStrategyDefault": "Single realm per environment; tenant_id as a claim; optionally multiple realms for enterprise isolation (future).",
            "claimsSourceOfTruth": "IdP token claims are authoritative for sub and tenant_id; roles claim may exist but service permissions remain authoritative via TenantAdminService."
          },
          "principalTypes": {
            "humanStaff": "OWNER/ADMIN/STAFF/MECHANIC are staff principals. Their authorization is permission-based and scoped by tenant/branch claims + membership validation.",
            "customerSelfService": "CUSTOMER principal type; access constrained by ownership rules and tenant scope.",
            "machineClient": "Service-to-service principals using client credentials and scopes (DEC-038). No end-user PII access unless explicitly granted by scoped permissions."
          },
          "staffProvisioning": {
            "default": "Owner/Admin invites staff by email/phone via IdP or TenantAdminService orchestration (implementation choice). Invite completion yields a staff Identity user (sub) linked to a tenant membership.",
            "requiredControls": [
              "Invites are one-time and TTL-bound (same security model as DEC-012; token must never contain PII).",
              "If a staff invite is accepted, TenantAdminService must create (or activate) membership records atomically (or compensate on failure).",
              "Disabling a staff user must immediately revoke membership (membership cache TTL is short; DEC-015) and is auditable."
            ],
            "mfaBaseline": {
              "defaultForEnterprise": "MFA required for all staff users (policy-driven).",
              "defaultForSmb": "MFA recommended; may be enforced by tenant policy.",
              "defaultForSoloSmall": "MFA optional by policy."
            }
          },
          "customerProvisioning": {
            "supportedModes": ["INVITE", "CLASSIC_REGISTER"],
            "linkingRules": [
              "Customer may exist as domain Customer (guest) before Identity user exists.",
              "When a Customer registers or accepts an invite, system links Identity sub to Customer.associatedUserId (subject to dedupe/link policy).",
              "A single Identity sub may map to at most one active Customer per tenant by default; exceptions require explicit enterprise policy and audit."
            ],
            "verification": {
              "phoneEmailVerificationDefault": "Optional for minimum mode; enterprise tenants may require verification before enabling self-service actions beyond read-only.",
              "verificationTokens": "Must be short-lived, one-time, hashed at rest, and never logged."
            }
          },
          "sessionAndRevocation": {
            "logout": "Logout must revoke refresh tokens at IdP; access token expiry is short-lived. Application membership validation (DEC-015) is the primary near-real-time revocation mechanism for authorization.",
            "accountDisable": "Disabling user must deny protected operations immediately (membership removed; fail-closed on cache miss)."
          },
          "claimAndPermissionMapping": {
            "rolesClaim": "May be present but is not relied upon for fine-grained permissions.",
            "permissionsAuthoritative": "Services compute effective permissions via TenantAdminService role/permission assignments + overrides; deny-by-default if mapping missing (DEC-019).",
            "audience": "aud must match target service; reject otherwise."
          }
        }
      },
      {
        "id": "DEC-041",
        "title": "Tenant/Branch/Role/Policy Data Model & API Invariants",
        "decision": "TenantAdminService defines canonical entities and invariants for tenancy, branches, membership, roles/permissions, and policies. All other services treat these as authoritative via APIs and events; no duplicated source-of-truth data models.",
        "details": {
          "canonicalEntities": {
            "Tenant": {
              "fields": [
                "id (UUID)",
                "name",
                "segment (SOLO_SMALL|SMB|ENTERPRISE)",
                "defaultLocale",
                "defaultCurrency",
                "branchRequired (boolean)",
                "strictPolicyValidationDefault (boolean)",
                "status (ACTIVE|SUSPENDED)",
                "createdAt/updatedAt/version/isDeleted"
              ],
              "invariants": [
                "Tenant.id is globally unique",
                "Tenant.status=SUSPENDED => protected write operations fail closed across services (policy-driven override is NOT allowed)"
              ]
            },
            "Branch": {
              "fields": [
                "id (UUID)",
                "tenantId",
                "code (short human code, required for invoice numbering)",
                "name",
                "timezone",
                "status (ACTIVE|INACTIVE)",
                "createdAt/updatedAt/version/isDeleted"
              ],
              "uniqueness": [
                "unique(tenantId, code) ignoring soft-deleted rows (DEC-009)",
                "unique(tenantId, name) may be enforced by policy (optional)"
              ],
              "invariants": [
                "Branch.timezone is required when appointments are enabled for that branch",
                "Branch.inactive => appointments cannot be scheduled; work orders may still be read"
              ]
            },
            "TenantMembership": {
              "fields": [
                "id (UUID)",
                "tenantId",
                "branchId (nullable; if present, membership is branch-scoped)",
                "userId (Identity sub)",
                "status (ACTIVE|REVOKED)",
                "createdAt/updatedAt/version"
              ],
              "uniqueness": [
                "unique(tenantId, branchId, userId) for branch-scoped membership",
                "unique(tenantId, userId) for tenant-scoped membership"
              ],
              "invariants": [
                "If tenant.branchRequired=true then protected operations require branchId in token AND membership must match branchId (DEC-001, DEC-015, DEC-020)."
              ]
            },
            "Role": {
              "fields": [
                "id (UUID)",
                "tenantId",
                "name",
                "type (SYSTEM|CUSTOM)",
                "permissions (array of strings from permissionCatalog)",
                "status (ACTIVE|INACTIVE)",
                "createdAt/updatedAt/version/isDeleted"
              ],
              "uniqueness": [
                "unique(tenantId, name) ignoring soft-deleted rows (DEC-009)"
              ],
              "invariants": [
                "SYSTEM roles are immutable except enable/disable flags (enterprise policy may allow edits but must be audited)",
                "CUSTOM roles require PERMISSIONS.customRolesEnabled policy to be true"
              ]
            },
            "RoleAssignment": {
              "fields": [
                "id (UUID)",
                "tenantId",
                "branchId (optional)",
                "userId (Identity sub)",
                "roleId",
                "effectiveFrom",
                "effectiveTo (optional)",
                "createdAt"
              ],
              "invariants": [
                "Assignments are auditable; changes emit RoleAssignmentsUpdated event"
              ]
            },
            "PolicyRecord": {
              "fields": [
                "id (UUID)",
                "tenantId",
                "branchId (optional)",
                "category (matches policySchemas categories)",
                "schemaVersion",
                "policyVersion (monotonic integer per tenant+category+scope)",
                "effectiveFrom",
                "publishedAt (optional; present only when published)",
                "status (DRAFT|PUBLISHED|ARCHIVED)",
                "payload (JSON)",
                "payloadHash (SHA-256 of canonical JSON)",
                "createdByUserId",
                "createdAt/updatedAt/version"
              ],
              "invariants": [
                "Only PUBLISHED policies are applied",
                "effectiveFrom is UTC and must be >= createdAt (unless migration)",
                "Unknown fields are rejected if strictValidation=true (DEC-023)"
              ]
            }
          },
          "apiInvariants": {
            "etag": "All mutable TenantAdmin entities must support ETag/If-Match (DEC-036).",
            "softDelete": "Soft delete allowed only for entities explicitly documented; hard delete forbidden by default.",
            "audit": [
              "All role changes, membership changes, and policy publishes must emit tamper-evident audit events (DEC-032)."
            ],
            "events": [
              "TenantUpdated",
              "BranchUpdated",
              "RoleUpdated",
              "RoleAssignmentsUpdated",
              "PolicyUpdated"
            ]
          },
          "crossServiceRules": [
            "Other services must not store mutable copies of roles/policies; they may cache them with TTL and invalidate on PolicyUpdated/RoleAssignmentsUpdated.",
            "If TenantAdminService is unreachable and membership cache miss occurs, protected operations must fail closed (DEC-015)."
          ]
        }
      },
      {
        "id": "DEC-042",
        "title": "Event Catalog & Publishing Semantics (Outbox + Idempotent Consumers)",
        "decision": "All events are governed by an explicit event catalog with versioned JSON Schemas. Producers publish via transactional outbox. Consumers are idempotent and operate under defined ordering and replay semantics.",
        "details": {
          "eventCatalogRequirement": "Each deployment includes a machine-readable catalog of all event types and their schemas; events not in the catalog are forbidden.",
          "producerRules": [
            "Publish only from OutboxEvent within the same transaction as the state change",
            "Include eventId (UUID) unique per event instance; never reuse across different logical events",
            "Include tenantId and aggregateId in every event envelope",
            "Do not include raw PII unless catalog explicitly allows it (PII class != NONE requires explicit approval and masking rules)"
          ],
          "publishingReliability": {
            "outboxPoller": {
              "intervalDefault": "PT1S",
              "batchSizeDefault": 100,
              "ordering": "Maintain per-aggregate ordering when draining outbox by aggregateId",
              "retryBackoff": "Exponential backoff with jitter; max attempts configurable; poison events go to DLQ with audit"
            }
          },
          "consumerRules": [
            "Consumers must dedupe by (tenantId, eventId, consumerGroup) using ProcessedEvent store",
            "Consumers must tolerate duplicate delivery and at-least-once semantics",
            "For out-of-order within an aggregate: buffer up to a bounded window or apply last-write-wins only where explicitly safe"
          ],
          "boundedOutOfOrderWindowDefaults": {
            "maxEvents": 50,
            "maxTime": "PT2M",
            "behaviorOnOverflow": "Send to DLQ as OUT_OF_ORDER_OVERFLOW with envelope and consumer diagnostics"
          },
          "dlqAndReplay": {
            "dlqEnvelope": "See DEC-024 dlqContract; add failureDiagnostics fields for consumer version and stack trace hash (no raw stack trace).",
            "replay": "Replay preserves eventId; consumers must remain idempotent. Replay action must be audited with counts and actor."
          }
        }
      },
      {
        "id": "DEC-043",
        "title": "Canonical State Machines & Transition Rules (WorkOrder + Invoice)",
        "decision": "WorkOrder and Invoice transitions are defined as canonical state machines. Policies may restrict or require transitions, but cannot introduce arbitrary new canonical states.",
        "details": {
          "workOrderStateMachine": {
            "canonicalStatuses": ["DRAFT", "OPEN", "IN_PROGRESS", "WAITING_CUSTOMER_APPROVAL", "COMPLETED", "CANCELED"],
            "terminalStatuses": ["COMPLETED", "CANCELED"],
            "allowedTransitionsBaseline": [
              { "from": "DRAFT", "to": "OPEN" },
              { "from": "OPEN", "to": "IN_PROGRESS" },
              { "from": "IN_PROGRESS", "to": "WAITING_CUSTOMER_APPROVAL" },
              { "from": "WAITING_CUSTOMER_APPROVAL", "to": "IN_PROGRESS" },
              { "from": "IN_PROGRESS", "to": "COMPLETED" },
              { "from": "OPEN", "to": "CANCELED" },
              { "from": "IN_PROGRESS", "to": "CANCELED" },
              { "from": "WAITING_CUSTOMER_APPROVAL", "to": "CANCELED" }
            ],
            "forbiddenTransitionsBaseline": [
              "COMPLETED -> any",
              "CANCELED -> any",
              "DRAFT -> COMPLETED (unless an enterprise policy explicitly allows bypass with audit)"
            ],
            "policyExtensionRules": [
              "Policies may require approvals before entering specific states (e.g., WAITING_CUSTOMER_APPROVAL or COMPLETED)",
              "Policies may require required fields / line items before transitions (DEC-033)",
              "Policies may define subStatus values, but each must map to a canonical status (DEC-005)"
            ]
          },
          "invoiceStateMachine": {
            "statuses": ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELED"],
            "terminalStatuses": ["PAID", "CANCELED"],
            "allowedTransitionsBaseline": [
              { "from": "DRAFT", "to": "ISSUED" },
              { "from": "ISSUED", "to": "PARTIALLY_PAID" },
              { "from": "ISSUED", "to": "PAID" },
              { "from": "ISSUED", "to": "OVERDUE" },
              { "from": "PARTIALLY_PAID", "to": "PAID" },
              { "from": "OVERDUE", "to": "PAID" },
              { "from": "DRAFT", "to": "CANCELED" }
            ],
            "cancellationRules": [
              "Cancel is allowed only when status=DRAFT by default",
              "Cancel after ISSUED requires enterprise policy and must be audited; if any payments exist, cancellation requires explicit reversal/refund transactions and a compensating audit trail"
            ],
            "immutabilityRules": [
              "After status=ISSUED: monetary snapshot and line items are immutable (DEC-013, DEC-033)",
              "Refunds do not delete history; they create reversal transactions (payment ledger is append-only)"
            ]
          },
          "eventEmissionRules": {
            "workOrder": [
              "On status change: emit WorkOrderStatusChanged with from/to, subStatus, and correlationId (no PII)",
              "On creation: emit WorkOrderCreated"
            ],
            "invoice": [
              "On issue: emit InvoiceIssued",
              "On payment recorded: emit PaymentRecorded (no PII; references by IDs)"
            ]
          }
        }
      },
      {
        "id": "DEC-044",
        "title": "Data Classification, Redaction, and Exposure Matrix",
        "decision": "All fields are classified and governed by where they may appear (logs, events, idempotency snapshots, API responses, DSAR export). Defaults are conservative to prevent accidental PII leakage.",
        "details": {
          "classificationLabels": [
            "AUTH_SECRET",
            "PII",
            "FINANCIAL",
            "SENSITIVE_NOTES",
            "OPERATIONAL"
          ],
          "globalRules": [
            "AUTH_SECRET must never appear in logs, events, idempotency snapshots, or client responses",
            "PII must be masked in logs and default UI read-model endpoints (DEC-018); full PII requires explicit permission",
            "Events default to IDs only (DEC-016); PII in events requires explicit catalog allowance and masking rules",
            "Idempotency response snapshot must remain minimal and must not store PII (DEC-011)"
          ],
          "fieldMatrix": {
            "Customer": {
              "PII": ["fullName", "phoneE164", "emailNormalized", "address"],
              "SENSITIVE_NOTES": ["notes"],
              "OPERATIONAL": ["type", "status", "associatedUserId", "phoneVerified", "emailVerified", "mergedIntoCustomerId", "anonymizedAt"]
            },
            "Vehicle": {
              "PII": ["rawPlate", "normalizedPlate", "vin", "engineNo"],
              "SENSITIVE_NOTES": ["notes"],
              "OPERATIONAL": ["make", "model", "year", "mileage", "customerId", "status"]
            },
            "WorkOrder": {
              "SENSITIVE_NOTES": ["problemShortNote", "problemDetails", "diagnosticsNotes"],
              "FINANCIAL": ["pricingSnapshot"],
              "OPERATIONAL": ["status", "subStatus", "assignedToUserId", "intakeMileage", "invoiceId", "completedAt", "flags", "customerId", "vehicleId"]
            },
            "Invoice": {
              "FINANCIAL": ["amountSubtotal", "amountTax", "amountDiscount", "amountTotal", "currency", "dueDate", "issuedAt"],
              "OPERATIONAL": ["status", "invoiceNumber", "workOrderId", "customerId"]
            },
            "PaymentTransaction": {
              "FINANCIAL": ["amount", "currency", "occurredAt", "method", "status", "reversalOfTransactionId"],
              "OPERATIONAL": ["invoiceId", "recordedByUserId"],
              "PII": ["receiptNumber"],
              "SENSITIVE_NOTES": [],
              "AUTH_SECRET": []
            },
            "FileAttachment": {
              "PII": ["fileName"],
              "OPERATIONAL": ["ownerType", "ownerId", "contentType", "sizeBytes", "storageKey", "checksum", "status"]
            },
            "AuditLog": {
              "OPERATIONAL": ["eventId", "eventType", "occurredAt", "actorUserId", "tenantId", "branchId", "resourceType", "resourceId", "summary", "prevHash", "hash"],
              "SENSITIVE_NOTES": ["metadata (sanitized only)"]
            }
          },
          "exposureControls": {
            "logs": {
              "default": "No raw PII or SENSITIVE_NOTES; log only masked identifiers and stable ids; never log AUTH_SECRET.",
              "masking": "Use maskingAndPII.maskingStandard in security.loggingAndPII."
            },
            "events": {
              "default": "IDs only; PII forbidden unless catalog explicitly allows masked fields and justification is documented."
            },
            "apiResponses": {
              "default": "Mask PII by default on BFF and list endpoints; full PII requires CUSTOMER_PII_READ and explicit endpoint contract (DEC-018)."
            },
            "dsar": {
              "export": "Include customer PII and associated records subject to retention and tenant policy (DEC-030).",
              "anonymize": "Replace PII with irreversible tokens; preserve accounting/legal records (DEC-007, DEC-030)."
            }
          }
        }
      },
      {
        "id": "DEC-045",
        "title": "Public Endpoint Abuse Controls (Invites, Search, Webhooks, Auth Adjacent)",
        "decision": "Public or high-risk endpoints apply layered abuse controls: strict rate limits, replay prevention, enumeration detection, and audit. Defaults are conservative and tenant-configurable where safe.",
        "details": {
          "generalControls": [
            "Gateway request size limits and IP throttling",
            "Per-tenant quotas for invite and verification flows",
            "CorrelationId + requestId required on all requests; audit security-relevant actions (DEC-032, DEC-014)",
            "Fail-closed if signature verification cannot be performed for webhooks"
          ],
          "inviteAcceptControls": {
            "endpoint": "POST /v1/customers/invites/accept",
            "required": [
              "Token hash stored at rest; constant-time compare (DEC-012)",
              "One-time consumption enforced with unique constraint",
              "IP-based throttling + per-tenant daily quota",
              "Audit every attempt (success/failure) with ipHash and userAgentHash (no raw values)"
            ],
            "optionalPolicyControls": [
              "Bot challenge (e.g., Turnstile/CAPTCHA) after suspicious thresholds",
              "Device fingerprint hash (privacy-safe) for anomaly detection"
            ]
          },
          "searchEnumerationControls": {
            "endpoints": [
              "GET /v1/vehicles/by-plate/{plate}",
              "GET /v1/customers (search/list)",
              "Any endpoint allowing query by phone/email"
            ],
            "defaults": [
              "Minimum query length enforced (DEC-028)",
              "Rate limit per actor (DEC-028) and adaptive throttling on high cardinality queries",
              "Require CUSTOMER_PII_READ for phone/email search; results masked by default",
              "Return generic ERR_RATE_LIMITED without hints that enable enumeration"
            ],
            "enumerationDetection": {
              "signals": [
                "High number of distinct plate queries per minute",
                "Repeated near-miss queries",
                "High 404 rate on search endpoints"
              ],
              "response": [
                "Progressive backoff",
                "Temporary actor/IP block (policy-driven)",
                "Security audit alert for enterprise tenants"
              ]
            }
          },
          "webhookControls": {
            "endpoint": "POST /v1/payments/webhooks/provider",
            "required": [
              "Verify signature before processing any payload fields",
              "Enforce timestamp skew limit (default ±5 minutes) and require provider event id",
              "Replay prevention store keyed by (tenantId, providerEventId) with TTL P30D",
              "Idempotency-Key semantics (DEC-004, DEC-025) must be applied to webhook handler"
            ],
            "errorHandling": [
              "On invalid signature: 401/403 ERR_WEBHOOK_SIGNATURE_INVALID (no details)",
              "On replay: 200 OK with no-op (or 409) per provider best practice; decision must be documented per provider adapter"
            ]
          },
          "authAdjacentControls": {
            "appliesTo": ["login throttling at IdP", "password reset", "verification code endpoints"],
            "baseline": [
              "Centralize brute-force protection in IdP",
              "Audit resets and verification attempts in aggregate (no PII)"
            ]
          }
        }
      },
      {
        "id": "DEC-046",
        "title": "Offline Mode & Sync Support",
        "decision": "The system supports a limited offline mode (PWA) for core operations with robust synchronization when connectivity is restored.",
        "details": {
          "offlineScope": [
            "Offline usage is focused on critical flows like capturing a new walk-in customer, vehicle, and work order (draft) when no connectivity.",
            "Requires user to have an active session (token cached); no new login offline.",
            "Only minimal data (e.g., reference data or last loaded records) is stored locally, encrypted if containing PII."
          ],
          "localStorage": [
            "Use browser IndexedDB or secure storage to save drafts and essential lookup data.",
            "Data at rest on device is encrypted where platform supports or obfuscated if not.",
            "Local drafts have unique temporary IDs that map to final IDs upon sync."
          ],
          "syncStrategy": [
            "On reconnection, the app syncs local drafts to the server via standard APIs (with Idempotency-Key to avoid duplicates).",
            "Conflicts (e.g., if record was also edited on another device) are resolved with last-write-wins or flagged for manual review.",
            "All offline-created records are marked as such in audit logs for traceability."
          ],
          "limitations": [
            "Offline mode in MVP is read/write for new records and basic viewing of cached data; real-time multi-user updates or complex operations require online connection.",
            "Admin actions (like policy changes or user management) are not available offline.",
            "Background sync and push notifications for updates are considered future enhancements."
          ]
        }
      }
    ]
  },
  "projectMetadata": {
    "name": "AutoRepairShop Management System",
    "description": "A scalable, multilingual auto repair shop management web application with progressive onboarding. It must support: (1) minimum viable usage for busy, low digital-literacy shops, (2) configurable workflows for SMB and enterprise multi-branch organizations, and (3) optional customer self-service and online payments.",
    "primaryNonFunctionalGoal": "Configurable simplicity: The same product can be used with minimal data and clicks, yet can be configured to match corporate process controls.",
    "targetOrganizations": [
      {
        "segment": "Solo/Small Shop",
        "example": "1-5 employees, 1 branch",
        "needs": ["Ultra-fast walk-in intake", "Minimal mandatory fields", "Optional payments and invoices", "Very simple screens and terms"]
      },
      {
        "segment": "SMB",
        "example": "10 employees, 2 branches",
        "needs": ["Basic appointment scheduling", "Permissions by staff role", "Branch-level reporting", "Inventory tracking", "Customer communication templates"]
      },
      {
        "segment": "Enterprise",
        "example": "400-500 employees, 10 branches",
        "needs": ["Multi-branch + centralized policies", "Approval workflows", "Audit/forensics", "SLA dashboards", "Data export, integrations, and governance", "Fine-grained permissions and custom roles"]
      }
    ],
    "technologies": {
      "frontend": ["React", "TypeScript", "mobile-first design", "i18next", "PWA-ready (optional)"],
      "backend": ["Java 17+", "Spring Boot", "Spring Security (Resource Server)", "Spring Cloud Gateway"],
      "database": ["PostgreSQL (initial)", "Flyway or Liquibase"],
      "futureDatabase": ["CockroachDB (horizontal scale option)"],
      "cache": ["Redis (optional; caching + idempotency + dedupe support)"],
      "messageBroker": ["Kafka (preferred)", "RabbitMQ (alternative)"],
      "containerization": ["Docker", "Kubernetes"],
      "auth": ["Keycloak (preferred) OIDC", "JWT RS256", "Client Credentials for service-to-service (DEC-038)"],
      "observability": ["OpenTelemetry", "Micrometer", "Prometheus", "Grafana"]
    },
    "designGoals": [
      "Progressive onboarding (minimum mode first, then advanced features)",
      "Configurable workflows and required fields per organization policy",
      "Multi-tenant SaaS readiness (shop/tenant scoping from day one)",
      "Security-first design (OIDC, RBAC + permissions, auditing)",
      "Operational excellence (idempotency, outbox, DLQ/replay, observability)",
      "Extensibility (mobile app, AI features, integrations)"
    ],
    "businessConstraints": {
      "minimumUsabilityMode": true,
      "mustSupportGuest": true,
      "onlinePaymentOptional": true,
      "cashOfflinePaymentMarkingRequired": true,
      "inviteAndClassicRegisterRequired": true,
      "accountLinkingAndDedupeRequired": true
    }
  },
  "productPrinciples": {
    "progressiveDisclosure": {
      "definition": "Default UI is minimal and guided. Advanced fields/features appear only when enabled by policy or explicitly expanded by the user.",
      "mustHaveUXPatterns": [
        "Single-screen fast intake for walk-ins",
        "Large touch targets and simple language",
        "Inline validation with clear actionable messages",
        "Autosuggest/lookup (plate, customer) to reduce typing",
        "Default templates to avoid blank forms",
        "Wizard-style flows for complex actions (merge customer, refunds, approvals, policy publishing)",
        "Duplicate plate resolution wizard: attach existing vs create new vs flag suspected duplicate"
      ]
    },
    "configurationFirst": {
      "definition": "Enterprise controls are achieved through policy configuration rather than code forks.",
      "configurableDimensions": [
        "Required fields per workflow/status transition",
        "Custom work order sub-statuses (within bounded rules) and approvals",
        "Branch/tenant scoping rules",
        "Role and permission model (custom roles + permission packs)",
        "Notification templates and channels",
        "Pricing/tax/discount policies",
        "Payment rules (partial payments, deposits, credit terms)",
        "Data retention, export, anonymization policies",
        "Appointment capacity and business hours policies",
        "File upload rules (size/content types/malware scan requirements)",
        "Search limits and visibility rules",
        "UI simplicity mode and field visibility"
      ]
    },
    "lowDigitalLiteracyReadiness": {
      "requirements": [
        "Minimize typing; prefer dropdowns, templates, and scanning where possible",
        "Avoid jargon; provide tooltips and helper text (localized)",
        "Allow operating without customer phone/email",
        "Allow operating without invoice/payment creation",
        "Avoid multi-step flows for core intake; keep it in one screen",
        "Provide clear error messages and guided recovery (e.g., duplicate plate attach suggestions)",
        "Support a local draft intake queue in UI (future PWA optional; server-side DRAFT always supported)"
      ]
    }
  },
  "tenancyAndBranchModel": {
    "tenancyModel": "Multi-tenant (SaaS-ready) with strict tenant isolation. Every business entity is scoped by tenantId (shopId).",
    "scopingFields": {
      "tenantId": "UUID (required on all entities; sourced from JWT claim tenant_id)",
      "branchId": "UUID (optional; sourced from JWT claim branch_id when applicable)"
    },
    "jwtClaimStandard": {
      "authoritativeClaims": {
        "tenantIdClaim": "tenant_id",
        "branchIdClaim": "branch_id",
        "userIdClaim": "sub",
        "rolesClaim": "roles",
        "localeClaimOptional": "locale"
      },
      "enforcement": [
        "If tenant_id missing: 403 Forbidden",
        "If branch required by policy and branch_id missing: 403 Forbidden",
        "Validate tenant membership and branch membership using TenantAdminService (cached with short TTL; DEC-015)."
      ]
    },
    "branchingRules": {
      "branchOptional": true,
      "enterprisePolicy": "Tenant may enforce branch required and branch-based data visibility.",
      "branchEnforcementMigration": "See DEC-020; default is fail-closed until migration completes.",
      "uniqueConstraints": [
        "Vehicle plate uniqueness must be tenant-scoped: unique(tenantId, normalizedPlate) by default.",
        "Optional stricter policy: unique(tenantId, branchId, normalizedPlate) if tenant chooses branch-specific vehicle registries.",
        "Soft delete must be considered in uniqueness (DEC-009).",
        "Plate normalization is canonical per DEC-034."
      ]
    },
    "dataIsolation": {
      "rule": "No cross-tenant reads/writes. tenantId derived from JWT claims; validated again in each service.",
      "enforcement": ["Row-level checks in service layer", "Repository queries always tenant-scoped"]
    }
  },
  "architectureOverview": {
    "architectureStyle": "Microservices with the option to start as a modular monolith (single deploy) and later split by bounded context without changing domain contracts.",
    "cleanArchitectureRules": [
      "Controller → Service → Repository layering per service",
      "DTO validation with annotation-based constraints",
      "Global exception handling with standardized error model",
      "No cross-service DB joins/foreign keys",
      "Domain events for cross-service workflows",
      "Defense-in-depth security: each service validates JWT",
      "Repository-level defaults must exclude soft-deleted rows unless explicitly requested",
      "Authorization evaluation order is fixed (DEC-019)",
      "Optimistic concurrency via ETag/If-Match (DEC-036)"
    ],
    "deploymentModes": {
      "modeA": {
        "name": "Modular Monolith (Starter)",
        "whenToUse": "Single developer or small team; fastest initial delivery.",
        "characteristics": [
          "Single codebase and deployable artifact",
          "Strict module boundaries enforced by packaging and contract tests",
          "Internal modules still communicate via interfaces/events internally"
        ]
      },
      "modeB": {
        "name": "Microservices (Scale)",
        "whenToUse": "Multiple teams or high scale requirements.",
        "characteristics": [
          "Services deployed independently",
          "Kafka/RabbitMQ used for cross-service workflows",
          "API gateway fronts all services"
        ]
      }
    },
    "interServiceCommunication": {
      "synchronous": "RESTful HTTP (JSON) via Gateway; keep synchronous calls mainly for read-model composition and simple queries.",
      "asynchronous": "Event-driven messaging via Kafka/RabbitMQ for cross-service workflows (audit, notifications, inventory reservations).",
      "serviceToServiceAuth": "Use client credentials and scopes (DEC-038).",
      "readModelStrategy": {
        "preferred": "BFF/Query API for UI composition to avoid chatty frontend and N+1 service calls.",
        "alternatives": [
          "Gateway composition (only if kept thin; avoid business logic in gateway)",
          "Materialized projections (CQRS read models) for high-scale dashboards"
        ]
      }
    },
    "apiGateway": {
      "responsibilities": [
        "Routing",
        "Request size limits",
        "Rate limiting",
        "CORS allowlist",
        "Security headers",
        "Correlation ID creation/propagation",
        "Optional coarse JWT validation (not the only enforcement)"
      ],
      "securityNote": "Gateway headers (e.g., X-Tenant-Id) are non-authoritative; services must validate JWT claims."
    },
    "serviceDiscovery": "Kubernetes DNS preferred; Eureka optional in non-K8s deployments.",
    "faultTolerance": {
      "library": "Resilience4j",
      "rules": [
        "Timeouts for all outbound calls",
        "Retries only for idempotent operations",
        "Circuit breakers on unstable dependencies",
        "Bulkheads for critical resources"
      ]
    },
    "databasePerService": {
      "rule": "Each service owns its schema. Start with one Postgres instance but separate schemas per service; migrate later to separate databases.",
      "migrationTooling": "Flyway/Liquibase must be used for deterministic migrations."
    },
    "moduleBoundaryTesting": {
      "starterModeRule": "Even in modular monolith mode, enforce module boundaries via package rules and contract tests.",
      "contractTesting": [
        "Consumer-driven contracts for BFF ↔ services",
        "Event contract tests for event topics/payloads"
      ]
    }
  },
  "rolesAndPermissions": {
    "roles": ["OWNER", "ADMIN", "STAFF", "MECHANIC", "CUSTOMER"],
    "principle": "Role-based defaults + permission-based overrides. Owner/Admin can grant fine-grained permissions to any user and can define custom roles for enterprise tenants.",
    "permissionCatalog": [
      "TENANT_SETTINGS_MANAGE",
      "BRANCH_MANAGE",
      "ROLE_PERMISSION_MANAGE",
      "CUSTOMER_CREATE_GUEST",
      "CUSTOMER_CREATE_REGISTERED",
      "CUSTOMER_INVITE_SEND",
      "CUSTOMER_INVITE_ACCEPT",
      "CUSTOMER_LINK_DEDUPE",
      "CUSTOMER_MERGE",
      "CUSTOMER_PII_READ",
      "CUSTOMER_DSAR_EXPORT",
      "CUSTOMER_DSAR_ANONYMIZE",
      "CUSTOMER_SOFT_DELETE",
      "VEHICLE_READ",
      "VEHICLE_CREATE_MINIMAL",
      "VEHICLE_UPDATE_DETAILS",
      "VEHICLE_TRANSFER_OWNERSHIP",
      "WORKORDER_READ",
      "WORKORDER_CREATE_FAST",
      "WORKORDER_UPDATE",
      "WORKORDER_ASSIGN",
      "WORKORDER_UPDATE_STATUS",
      "WORKORDER_APPROVAL_REQUEST",
      "WORKORDER_APPROVAL_RECORD",
      "INVENTORY_READ",
      "INVENTORY_MANAGE",
      "INVENTORY_STOCK_LEDGER_READ",
      "PARTS_RESERVATION_REQUEST",
      "PARTS_CONSUMPTION_RECORD",
      "PARTS_RETURN_RECORD",
      "INVOICE_READ",
      "INVOICE_CREATE",
      "INVOICE_ISSUE",
      "PAYMENT_RECORD_CASH",
      "PAYMENT_RECORD_TRANSFER",
      "PAYMENT_INITIATE_ONLINE",
      "PAYMENT_REFUND",
      "APPOINTMENT_MANAGE",
      "AUDIT_READ",
      "FILES_MANAGE",
      "POLICY_SIMULATE",
      "POLICY_PUBLISH_CANARY",
      "POLICY_PUBLISH_TENANT"
    ],
    "ownershipRules": {
      "customerAccess": "CUSTOMER can only access resources where resource.customerId == associatedCustomerId AND tenantId matches.",
      "staffAccess": "STAFF/MECHANIC access governed by permissions plus tenant/branch scope.",
      "audit": "Only OWNER/ADMIN (or explicitly permitted) may access audit logs."
    },
    "defaultRoleCapabilities": {
      "OWNER": { "can": ["ALL_PERMISSIONS"] },
      "ADMIN": {
        "can": [
          "TENANT_SETTINGS_MANAGE",
          "BRANCH_MANAGE",
          "ROLE_PERMISSION_MANAGE",
          "AUDIT_READ",
          "CUSTOMER_INVITE_SEND",
          "CUSTOMER_INVITE_ACCEPT",
          "CUSTOMER_LINK_DEDUPE",
          "CUSTOMER_MERGE",
          "CUSTOMER_PII_READ",
          "CUSTOMER_DSAR_EXPORT",
          "CUSTOMER_DSAR_ANONYMIZE",
          "CUSTOMER_SOFT_DELETE",
          "INVENTORY_MANAGE",
          "INVENTORY_STOCK_LEDGER_READ",
          "INVOICE_CREATE",
          "INVOICE_ISSUE",
          "PAYMENT_RECORD_CASH",
          "PAYMENT_RECORD_TRANSFER",
          "PAYMENT_INITIATE_ONLINE",
          "PAYMENT_REFUND",
          "APPOINTMENT_MANAGE",
          "WORKORDER_CREATE_FAST",
          "WORKORDER_READ",
          "WORKORDER_UPDATE",
          "WORKORDER_ASSIGN",
          "WORKORDER_UPDATE_STATUS",
          "VEHICLE_READ",
          "VEHICLE_CREATE_MINIMAL",
          "VEHICLE_UPDATE_DETAILS",
          "VEHICLE_TRANSFER_OWNERSHIP",
          "FILES_MANAGE",
          "POLICY_SIMULATE",
          "POLICY_PUBLISH_CANARY",
          "POLICY_PUBLISH_TENANT"
        ]
      },
      "STAFF": {
        "can": [
          "CUSTOMER_CREATE_GUEST",
          "CUSTOMER_INVITE_SEND",
          "VEHICLE_READ",
          "VEHICLE_CREATE_MINIMAL",
          "WORKORDER_CREATE_FAST",
          "WORKORDER_READ",
          "WORKORDER_UPDATE",
          "WORKORDER_ASSIGN",
          "APPOINTMENT_MANAGE",
          "INVOICE_READ",
          "PAYMENT_RECORD_CASH"
        ]
      },
      "MECHANIC": {
        "can": [
          "WORKORDER_READ",
          "WORKORDER_UPDATE",
          "WORKORDER_UPDATE_STATUS",
          "INVENTORY_READ",
          "PARTS_CONSUMPTION_RECORD",
          "PARTS_RETURN_RECORD"
        ],
        "notes": ["Mechanic may be granted additional permissions by tenant policy (e.g., create fast intake)."]
      },
      "CUSTOMER": {
        "can": [
          "SELF_READ_OWN_DATA",
          "APPOINTMENT_SELF_CREATE",
          "WORKORDER_SELF_READ",
          "INVOICE_SELF_VIEW",
          "PAYMENT_INITIATE_ONLINE"
        ]
      }
    },
    "endpointPermissionMatrix": {
      "rule": "If an endpoint is not listed here, treat it as protected and deny-by-default until mapped (DEC-019).",
      "TenantAdminService": {
        "GET /v1/tenant/settings": { "permissions": ["TENANT_SETTINGS_MANAGE"] },
        "PUT /v1/tenant/settings": { "permissions": ["TENANT_SETTINGS_MANAGE"], "audit": true, "ifMatchRequired": true },
        "GET /v1/tenant/branches": { "permissions": ["BRANCH_MANAGE"] },
        "POST /v1/tenant/branches": { "permissions": ["BRANCH_MANAGE"], "audit": true },
        "PUT /v1/tenant/branches/{id}": { "permissions": ["BRANCH_MANAGE"], "audit": true, "ifMatchRequired": true },
        "GET /v1/tenant/policies": { "permissions": ["TENANT_SETTINGS_MANAGE"] },
        "POST /v1/tenant/policies/simulate": { "permissions": ["POLICY_SIMULATE"], "audit": true },
        "PUT /v1/tenant/policies": { "permissions": ["TENANT_SETTINGS_MANAGE"], "audit": true, "ifMatchRequired": true },
        "POST /v1/tenant/policies/publish/canary": { "permissions": ["POLICY_PUBLISH_CANARY"], "audit": true },
        "POST /v1/tenant/policies/publish/tenant": { "permissions": ["POLICY_PUBLISH_TENANT"], "audit": true },
        "GET /v1/tenant/roles": { "permissions": ["ROLE_PERMISSION_MANAGE"] },
        "PUT /v1/tenant/roles": { "permissions": ["ROLE_PERMISSION_MANAGE"], "audit": true, "ifMatchRequired": true },
        "POST /v1/tenant/roles": { "permissions": ["ROLE_PERMISSION_MANAGE"], "audit": true },
        "DELETE /v1/tenant/roles/{id}": { "permissions": ["ROLE_PERMISSION_MANAGE"], "audit": true },
        "GET /v1/tenant/role-assignments": { "permissions": ["ROLE_PERMISSION_MANAGE"] },
        "POST /v1/tenant/role-assignments": { "permissions": ["ROLE_PERMISSION_MANAGE"], "audit": true },
        "DELETE /v1/tenant/role-assignments/{id}": { "permissions": ["ROLE_PERMISSION_MANAGE"], "audit": true }
      }
    }
  },
  "processFlows": {
    "fastIntakeWalkIn": {
      "description": "Single-screen flow for creating a new customer (guest), vehicle, and work order quickly.",
      "initialData": {
        "customer": ["fullName (or auto label 'Guest')"],
        "vehicle": ["licensePlate", "make", "model (optional)"],
        "workOrder": ["problemShortNote (optional)"]
      },
      "steps": [
        "Staff/mechanic searches by plate (normalized) (search-first UX, optional)",
        "If existing vehicle found (with or without matching customer), prompt attach vs create new",
        "If plate not found or user chooses new: enter minimal vehicle + optional customer details",
        "Open work order in DRAFT status with problem note"
      ],
      "postCreation": "Work order remains DRAFT until more details are added or it is explicitly opened."
    },
    "appointmentBooking": {
      "description": "Customer self-service or staff-assisted appointment scheduling.",
      "initialData": {
        "customer": ["fullName (or Guest label)"],
        "vehicle": ["licensePlate", "make", "model (optional)"],
        "workOrder": [],
        "invoice": []
      },
      "optionalData": {
        "customer": ["phoneE164", "emailNormalized", "address", "notes"],
        "vehicle": ["year", "vin", "engineNo", "mileage", "color", "notes", "photos"],
        "workOrder": ["problemDetails", "diagnostics", "laborItems", "partsPlanned", "attachments", "customerApprovals"],
        "invoice": ["partialPayments", "receiptNumber", "dueDate", "lineItems"]
      },
      "notes": "Appointment creates a placeholder work order (DRAFT) linked to the appointment; actual work execution occurs when vehicle is checked in."
    }
  },
  "minimumMode": {
    "enabled": true,
    "definition": "Operating mode with minimal required data to accommodate busy or low-tech environments.",
    "requiredDataAtCreateTime": {
      "customer": ["fullName (or auto-generated 'Guest' identifier)"],
      "vehicle": ["rawPlate", "make", "model (optional)"],
      "workOrder": ["problemShortNote (optional)"]
    },
    "optionalData": {
      "customer": [],
      "vehicle": ["color", "vin", "engineNo", "year", "mileage"],
      "workOrder": ["problemDetails", "diagnosticsNotes"]
    },
    "uiRecommendations": {
      "hideAdvancedSectionsByDefault": true,
      "showLineItemsByDefault": false,
      "confirmations": {
        "attachExistingVehicleToDifferentCustomer": true,
        "createDuplicatePlateVehicle": true
      }
    }
  },
  "policySchemas": {
    "DATA_RETENTION": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "auditRetention": { "type": "string", "default": "P2Y" },
          "workOrderRetention": { "type": "string", "default": "P7Y" },
          "invoiceRetention": { "type": "string", "default": "P7Y" },
          "anonymization": {
            "type": "object",
            "properties": {
              "enabled": { "type": "boolean", "default": true },
              "maskingStandard": { "type": "string", "default": "DEFAULT" }
            }
          }
        }
      },
      "defaults": {
        "auditRetention": "P2Y",
        "workOrderRetention": "P7Y",
        "invoiceRetention": "P7Y",
        "anonymization": { "enabled": true, "maskingStandard": "DEFAULT" }
      }
    },
    "PERMISSIONS": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "customRolesEnabled": { "type": "boolean", "default": false },
          "permissionPacks": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "permissions"],
              "properties": {
                "name": { "type": "string" },
                "permissions": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      },
      "defaults": { "customRolesEnabled": false, "permissionPacks": [] }
    },
    "APPOINTMENT_RULES": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "slotSize": { "type": "string", "default": "PT30M" },
          "capacityPerSlot": { "type": "integer", "minimum": 1, "default": 1 },
          "noShowGrace": { "type": "string", "default": "PT15M" },
          "allowCustomerSelfBooking": { "type": "boolean", "default": false }
        }
      },
      "defaults": { "slotSize": "PT30M", "capacityPerSlot": 1, "noShowGrace": "PT15M", "allowCustomerSelfBooking": false }
    },
    "SEARCH_LIMITS": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "minPlateQueryLength": { "type": "integer", "minimum": 1, "default": 2 },
          "minCustomerQueryLength": { "type": "integer", "minimum": 1, "default": 2 },
          "maxResults": { "type": "integer", "minimum": 5, "maximum": 100, "default": 20 }
        }
      },
      "defaults": { "minPlateQueryLength": 2, "minCustomerQueryLength": 2, "maxResults": 20 }
    },
    "FILE_SECURITY": {
      "schemaVersion": 2,
      "schema": {
        "type": "object",
        "properties": {
          "maxSizeBytes": { "type": "integer", "minimum": 1048576, "default": 25000000 },
          "allowedContentTypes": { "type": "array", "items": { "type": "string" } },
          "malwareScanRequired": { "type": "boolean", "default": false },
          "encryptionAtRest": { "type": "string", "enum": ["SSE_S3", "SSE_KMS", "NONE"], "default": "SSE_S3" },
          "tenantIsolationPrefixRequired": { "type": "boolean", "default": true }
        }
      },
      "defaults": {
        "maxSizeBytes": 25000000,
        "allowedContentTypes": ["image/jpeg", "image/png", "application/pdf"],
        "malwareScanRequired": false,
        "encryptionAtRest": "SSE_S3",
        "tenantIsolationPrefixRequired": true
      }
    },
    "PRICING_TAX_RULES": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "currencyAllowlist": { "type": "array", "items": { "type": "string" }, "default": ["TRY", "EUR", "USD"] },
          "tax": {
            "type": "object",
            "properties": {
              "vatEnabled": { "type": "boolean", "default": true },
              "vatRateDefault": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.2 },
              "roundingMode": { "type": "string", "enum": ["HALF_UP", "HALF_EVEN"], "default": "HALF_UP" }
            }
          },
          "discounts": {
            "type": "object",
            "properties": {
              "maxDiscountRate": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.3 },
              "requiresApprovalAboveRate": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.15 }
            }
          },
          "labor": {
            "type": "object",
            "properties": {
              "hourlyRateDefault": { "type": "number", "minimum": 0, "default": 0 },
              "allowCustomLaborRates": { "type": "boolean", "default": true }
            }
          }
        }
      },
      "defaults": {
        "currencyAllowlist": ["TRY", "EUR", "USD"],
        "tax": { "vatEnabled": true, "vatRateDefault": 0.2, "roundingMode": "HALF_UP" },
        "discounts": { "maxDiscountRate": 0.3, "requiresApprovalAboveRate": 0.15 },
        "labor": { "hourlyRateDefault": 0, "allowCustomLaborRates": true }
      }
    },
    "NOTIFICATION_RULES": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "enabled": { "type": "boolean", "default": true },
          "quietHours": {
            "type": "object",
            "properties": { "startLocal": { "type": "string" }, "endLocal": { "type": "string" } }
          },
          "channels": { "type": "array", "items": { "type": "string", "enum": ["SMS", "EMAIL", "WHATSAPP", "PUSH"] } },
          "templates": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "content", "channel"],
              "properties": {
                "name": { "type": "string" },
                "channel": { "type": "string", "enum": ["SMS", "EMAIL", "WHATSAPP", "PUSH"] },
                "content": { "type": "string" },
                "locale": { "type": "string" },
                "isDefault": { "type": "boolean" }
              }
            }
          }
        }
      },
      "defaults": {
        "enabled": true,
        "quietHours": {},
        "channels": ["SMS", "EMAIL"],
        "templates": []
      }
    },
    "UI_SIMPLICITY_MODE": {
      "schemaVersion": 1,
      "schema": {
        "type": "object",
        "properties": {
          "enabled": { "type": "boolean", "default": true },
          "hideAdvancedSectionsByDefault": { "type": "boolean", "default": true },
          "showLineItemsByDefault": { "type": "boolean", "default": false },
          "requireConfirmations": {
            "type": "object",
            "properties": {
              "attachExistingVehicleToDifferentCustomer": { "type": "boolean", "default": true },
              "createDuplicatePlateVehicle": { "type": "boolean", "default": true }
            }
          }
        }
      },
      "defaults": {
        "enabled": true,
        "hideAdvancedSectionsByDefault": true,
        "showLineItemsByDefault": false,
        "requireConfirmations": {
          "attachExistingVehicleToDifferentCustomer": true,
          "createDuplicatePlateVehicle": true
        }
      }
    }
  },
  "entities": {
    "commonFields": {
      "id": "UUID",
      "tenantId": "UUID (required)",
      "branchId": "UUID (optional; required if tenant enforces branch)",
      "createdAt": "Timestamp (UTC)",
      "updatedAt": "Timestamp (UTC)",
      "createdByUserId": "UUID (optional; required in enterprise policy mode)",
      "updatedByUserId": "UUID (optional)",
      "isDeleted": "Boolean (soft delete)",
      "deletedAt": "Timestamp (UTC, optional)",
      "version": "Long (@Version optimistic locking; exposed via ETag per DEC-036)"
    },
    "Customer": {
      "description": "Represents a customer (guest or registered). Can be linked to an Identity user.",
      "fields": {
        "type": "String (GUEST, REGISTERED)",
        "fullName": "String",
        "phoneE164": "String (optional, dedupe/linking)",
        "emailNormalized": "String (optional, dedupe/linking)",
        "phoneVerified": "Boolean",
        "emailVerified": "Boolean",
        "address": "String (optional)",
        "associatedUserId": "UUID (optional, Identity user link)",
        "status": "String (ACTIVE, INACTIVE, MERGED)",
        "mergedIntoCustomerId": "UUID (optional)",
        "anonymizedAt": "Timestamp (UTC, optional)",
        "anonymizationProfile": "String (optional)"
      }
    },
    "CustomerRedirect": {
      "description": "Redirect mapping from merged customer to active target customer to preserve references and avoid broken links.",
      "fields": {
        "sourceCustomerId": "UUID",
        "targetCustomerId": "UUID",
        "reason": "String",
        "createdAt": "Timestamp UTC"
      }
    },
    "Vehicle": {
      "description": "Vehicle profile linked to a customer. Supports minimal creation and later enrichment.",
      "fields": {
        "customerId": "UUID (required; DEC-021)",
        "rawPlate": "String",
        "normalizedPlate": "String (derived; DEC-034)",
        "make": "String",
        "model": "String (optional)",
        "year": "Integer (optional)",
        "vin": "String (optional)",
        "engineNo": "String (optional)",
        "mileage": "Integer (optional)",
        "notes": "String (optional)",
        "status": "String (ACTIVE, INACTIVE)"
      }
    },
    "VehicleOwnershipHistory": {
      "description": "Append-only history for vehicle ownership changes.",
      "fields": {
        "vehicleId": "UUID",
        "fromCustomerId": "UUID",
        "toCustomerId": "UUID",
        "changedAt": "Timestamp UTC",
        "changedByUserId": "UUID",
        "reason": "String (optional)"
      }
    },
    "WorkOrder": {
      "description": "Execution record for repair/maintenance job. Created from walk-in or appointment.",
      "fields": {
        "customerId": "UUID",
        "vehicleId": "UUID",
        "status": "String (DRAFT, OPEN, IN_PROGRESS, WAITING_CUSTOMER_APPROVAL, COMPLETED, CANCELED)",
        "subStatus": "String (optional; tenant-defined; must map to canonical status)",
        "problemShortNote": "String (optional)",
        "problemDetails": "String (optional)",
        "assignedToUserId": "UUID (optional)",
        "intakeMileage": "Integer (optional)",
        "diagnosticsNotes": "String (optional)",
        "currency": "String (ISO)",
        "invoiceId": "UUID (optional)",
        "completedAt": "Timestamp (UTC, optional)",
        "pricingSnapshot": "JSON (optional; derived totals, tax, discount; immutable only once invoice issued)",
        "flags": "JSON (optional; e.g., inventoryInconsistency=true)"
      }
    },
    "WorkOrderLaborItem": {
      "description": "Optional labor line items for a work order.",
      "fields": {
        "workOrderId": "UUID",
        "name": "String",
        "description": "String (optional)",
        "quantityHours": "Decimal (scale=2, min=0)",
        "unitRate": "Decimal (scale=2, min=0)",
        "taxRate": "Decimal (0..1, optional)",
        "discountRate": "Decimal (0..1, optional)",
        "total": "Decimal (scale=2, derived)"
      }
    },
    "WorkOrderPartItem": {
      "description": "Optional part items for a work order; can represent planned, reserved, consumed, or returned parts.",
      "fields": {
        "workOrderId": "UUID",
        "inventoryPartId": "UUID (optional; if custom part, may be null and use custom fields)",
        "customPartName": "String (optional)",
        "quantity": "Decimal (scale=3, min=0)",
        "unitPriceSnapshot": "Decimal (scale=2, optional)",
        "currency": "String (ISO)",
        "status": "String (PLANNED, RESERVED, CONSUMED, RETURNED, CANCELED)",
        "reservationId": "UUID (optional)",
        "externalReference": "String (optional)"
      }
    },
    "Invoice": {
      "description": "Authoritative accounting snapshot for a work order (optional in minimum mode).",
      "fields": {
        "workOrderId": "UUID",
        "customerId": "UUID",
        "invoiceNumber": "String (tenant scoped sequential human-readable; DEC-013, DEC-029)",
        "status": "String (DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELED)",
        "amountSubtotal": "Decimal (scale=2, optional)",
        "amountTax": "Decimal (scale=2, optional)",
        "amountDiscount": "Decimal (scale=2, optional)",
        "amountTotal": "Decimal (scale=2)",
        "currency": "String (ISO)",
        "dueDate": "Date (optional)",
        "issuedAt": "Timestamp (UTC, optional)",
        "canceledAt": "Timestamp (UTC, optional)",
        "immutableAfterIssued": "Boolean (derived; DEC-013)"
      }
    },
    "InvoiceLineItem": {
      "description": "Invoice snapshot line items (immutable once ISSUED).",
      "fields": {
        "invoiceId": "UUID",
        "type": "String (LABOR, PART, FEE, DISCOUNT, ADJUSTMENT)",
        "name": "String",
        "description": "String (optional)",
        "quantity": "Decimal (scale=3)",
        "unitPrice": "Decimal (scale=2)",
        "taxRate": "Decimal (0..1, optional)",
        "discountRate": "Decimal (0..1, optional)",
        "total": "Decimal (scale=2)"
      }
    },
    "PaymentTransaction": {
      "description": "Append-only payment ledger entries linked to an invoice.",
      "fields": {
        "invoiceId": "UUID",
        "method": "String (CASH, TRANSFER, ONLINE_PROVIDER)",
        "amount": "Decimal (scale=2)",
        "currency": "String (ISO)",
        "occurredAt": "Timestamp (UTC)",
        "recordedByUserId": "UUID",
        "receiptNumber": "String (optional)",
        "externalTransactionId": "String (optional)",
        "status": "String (RECORDED, REVERSED)",
        "reversalOfTransactionId": "UUID (optional)"
      }
    },
    "PartsReservation": {
      "description": "Inventory reservation linked to a work order (supports saga DEC-037).",
      "fields": {
        "workOrderId": "UUID",
        "status": "String (REQUESTED, RESERVED, REJECTED, CANCELED, CONSUMED)",
        "items": "JSON (partId, qty, unit)",
        "requestedAt": "Timestamp UTC",
        "confirmedAt": "Timestamp UTC (optional)",
        "reason": "String (optional)",
        "correlationId": "String",
        "idempotencyKey": "String"
      }
    },
    "FileAttachment": {
      "description": "Metadata for attachments stored in object storage.",
      "fields": {
        "ownerType": "String (WORK_ORDER, VEHICLE, INVOICE)",
        "ownerId": "UUID",
        "fileName": "String",
        "contentType": "String",
        "sizeBytes": "Long",
        "storageKey": "String (tenant/branch isolation prefix required by policy)",
        "checksum": "String (optional)",
        "status": "String (ACTIVE, QUARANTINED, DELETED)",
        "deletedAt": "Timestamp (UTC, optional)"
      }
    },
    "AuditLog": {
      "description": "Append-only audit records for security and business-critical actions. Tamper-evident per DEC-032.",
      "fields": {
        "eventId": "UUID",
        "eventType": "String",
        "occurredAt": "Timestamp (UTC)",
        "actorUserId": "UUID (optional for system actions)",
        "tenantId": "UUID",
        "branchId": "UUID (optional)",
        "resourceType": "String",
        "resourceId": "UUID (optional)",
        "summary": "String",
        "metadata": "JSON (sanitized, no secrets, no tokens, no raw PII)",
        "prevHash": "String (optional)",
        "hash": "String (SHA-256)"
      }
    },
    "IdempotencyRecord": {
      "description": "Idempotency store per tenant and per endpoint category.",
      "fields": {
        "tenantId": "UUID",
        "endpointKey": "String",
        "idempotencyKey": "String",
        "requestHash": "String (SHA-256)",
        "responseStatus": "Integer",
        "responseBody": "JSON (minimal safe subset only; DEC-011)",
        "createdAt": "Timestamp UTC",
        "expiresAt": "Timestamp UTC"
      }
    },
    "OutboxEvent": {
      "description": "Transactional outbox records for reliable event publication.",
      "fields": {
        "id": "UUID",
        "tenantId": "UUID",
        "branchId": "UUID (optional)",
        "eventType": "String",
        "eventVersion": "Integer",
        "occurredAt": "Timestamp UTC",
        "payload": "JSON",
        "publishedAt": "Timestamp UTC (optional)",
        "status": "String (PENDING, PUBLISHED, FAILED)"
      }
    },
    "ProcessedEvent": {
      "description": "Consumer-side dedupe store for idempotent event handling.",
      "fields": {
        "tenantId": "UUID",
        "eventId": "UUID",
        "consumerGroup": "String",
        "processedAt": "Timestamp UTC",
        "expiresAt": "Timestamp UTC (optional)"
      }
    }
  },
  "validationCatalog": {
    "stringConstraints": {
      "Customer.fullName": { "min": 1, "max": 120, "trim": true },
      "Customer.phoneE164": { "pattern": "^\\+[1-9]\\d{6,14}$", "nullable": true },
      "Customer.emailNormalized": { "max": 254, "normalize": "lowercase+trim", "nullable": true },
      "Vehicle.rawPlate": { "min": 2, "max": 64, "trim": true, "notes": "rawPlate may contain spaces/hyphens; normalizedPlate uses DEC-034 rules" },
      "Vehicle.normalizedPlate": { "max": 16, "normalize": "DEC-034 canonical algorithm" },
      "Vehicle.make": { "min": 1, "max": 60, "trim": true },
      "Vehicle.model": { "max": 60, "nullable": true },
      "Vehicle.vin": { "pattern": "^[A-HJ-NPR-Z0-9]{11,17}$", "nullable": true },
      "WorkOrder.problemShortNote": { "max": 240, "nullable": true },
      "WorkOrder.problemDetails": { "max": 4000, "nullable": true },
      "common.notes": { "max": 4000, "nullable": true },
      "Invoice.invoiceNumber": { "max": 40, "nullable": true },
      "InvoiceLineItem.name": { "min": 1, "max": 120, "trim": true }
    },
    "numericConstraints": {
      "Vehicle.year": { "min": 1950, "max": 2100, "nullable": true },
      "Vehicle.mileage": { "min": 0, "max": 3000000, "nullable": true },
      "Money.scale": { "scale": 2 },
      "WorkOrderLaborItem.quantityHours": { "min": 0, "max": 1000 },
      "WorkOrderPartItem.quantity": { "min": 0, "max": 100000 }
    }
  },
  "apiStandards": {
    "openapi": { "requirement": "Each service publishes and versions its OpenAPI spec." },
    "versioning": {
      "strategy": "URL prefix versioning",
      "example": "/v1/workorders",
      "breakingChangeRule": "Breaking changes require /v2 and a deprecation period (DEC-006)."
    },
    "errorModel": {
      "standardResponse": {
        "timestamp": "ISO-8601 (UTC)",
        "requestId": "X-Request-Id",
        "errorId": "Unique instance id",
        "errorCode": "Stable machine-readable code",
        "message": "Localized message",
        "messageKey": "i18n key (optional)",
        "details": [{ "field": "fieldName", "message": "validation or domain detail" }]
      },
      "securityGuideline": "Never return stack traces or internal exception details to clients."
    },
    "errorCodeCatalog": {
      "note": "Mandatory per DEC-027",
      "codes": [
        "ERR_AUTH_UNAUTHORIZED",
        "ERR_AUTH_FORBIDDEN",
        "ERR_AUTH_TENANT_MISSING",
        "ERR_AUTH_BRANCH_REQUIRED",
        "ERR_AUTH_MEMBERSHIP_UNKNOWN",
        "ERR_PERMISSION_DENIED",
        "ERR_OWNERSHIP_DENIED",
        "ERR_VALIDATION_FAILED",
        "ERR_RESOURCE_NOT_FOUND",
        "ERR_RESOURCE_CONFLICT",
        "ERR_POLICY_INVALID_SCHEMA",
        "ERR_IDEMPOTENCY_HASH_MISMATCH",
        "ERR_IDEMPOTENCY_REPLAY",
        "ERR_DUPLICATE_PLATE",
        "ERR_FILE_NOT_ALLOWED",
        "ERR_FILE_TOO_LARGE",
        "ERR_WEBHOOK_SIGNATURE_INVALID",
        "ERR_RATE_LIMITED",
        "ERR_PRECONDITION_REQUIRED",
        "ERR_INTERNAL"
      ]
    },
    "paginationStandard": {
      "defaultPageSize": 20,
      "maxPageSize": 100,
      "recommendation": "Use keyset pagination for high-volume lists; otherwise page/size."
    },
    "idempotency": {
      "whereNeeded": [
        "POST endpoints that may be retried by clients",
        "Work order creation in fast intake",
        "Payment initiation and webhooks",
        "Parts reservation requests",
        "Appointment check-in"
      ],
      "mechanism": "Idempotency-Key header stored server-side (tenant-scoped) with TTL/persistence; replay returns same result.",
      "payloadMismatchRule": "Same key + different payload => 409 Conflict (DEC-004).",
      "responseSnapshotRule": "Store minimal safe response fields only (DEC-011).",
      "atomicityRule": "See DEC-025"
    },
    "concurrency": {
      "standard": "Optimistic locking via ETag/If-Match (DEC-036).",
      "statusCodes": {
        "missingIfMatch": "428 (ERR_PRECONDITION_REQUIRED)",
        "versionMismatch": "409 (ERR_RESOURCE_CONFLICT)"
      }
    },
    "moneyAndTimeStandards": {
      "money": {
        "scale": 2,
        "rounding": "HALF_UP",
        "currency": "Always include ISO currency code; validate against tenant allowlist",
        "invoiceCurrencyRule": "Invoice currency is immutable after ISSUED (DEC-013)."
      },
      "time": { "storage": "UTC", "display": "Format by locale/timezone in UI" }
    }
  },
  "eventingStandards": {
    "enabled": true,
    "eventEnvelope": {
      "fields": ["eventId", "eventType", "eventVersion", "occurredAt", "producer", "traceId", "requestId", "tenantId", "branchId", "aggregateId", "payload"]
    },
    "topicConventions": {
      "examples": [
        "workorder.events.v1",
        "inventory.events.v1",
        "payment.events.v1",
        "appointment.events.v1",
        "notification.commands.v1",
        "audit.events.v1",
        "tenantadmin.events.v1"
      ]
    },
    "serializationAndSchema": {
      "format": "JSON",
      "schemaGovernance": "DEC-024",
      "compatibility": "BACKWARD",
      "consumerRules": [
        "Ignore unknown fields",
        "Validate required fields",
        "Idempotent processing using ProcessedEvent store"
      ]
    },
    "piiInEvents": {
      "rule": "Prefer referencing entities by ID. Avoid embedding phone/email in events unless explicitly required by NotificationService adapters.",
      "defaultNotificationApproach": "Pull model (DEC-016)."
    },
    "sagaContracts": {
      "workOrderInventory": { "decision": "DEC-037", "notes": "Events listed in DEC-037 must be included in the event catalog and contract tested." }
    }
  },
  "security": {
    "authentication": {
      "preferred": "OIDC via Keycloak; JWT RS256",
      "notes": [
        "Gateway may validate tokens, but each service must validate JWT as a Resource Server.",
        "Use short-lived access tokens; refresh via IdP.",
        "Service-to-service calls use client credentials (DEC-038)."
      ]
    },
    "authorization": {
      "model": "RBAC + permission overrides + ownership + tenant/branch scope",
      "evaluationOrder": "See DEC-019",
      "enforcement": [
        "Service-layer policy checks are authoritative",
        "Repository queries always tenant-scoped",
        "Admin operations produce audit logs",
        "Membership (tenant/branch/user) is validated via TenantAdminService short-TTL cache (DEC-015)",
        "Endpoint mapping deny-by-default enforced via endpointPermissionMatrix"
      ]
    },
    "transportSecurity": {
      "external": "HTTPS required; HSTS enabled",
      "internal": "mTLS via service mesh is optional future; apply K8s NetworkPolicies"
    },
    "loggingAndPII": {
      "rule": "Never log passwords/tokens/card data; minimize PII; mask identifiers where needed.",
      "maskingStandard": {
        "phone": "*******12",
        "email": "a***@d***.com",
        "uuid": "first8chars",
        "token": "never log"
      },
      "requestResponseLogging": {
        "default": "OFF",
        "exception": "May be enabled in non-prod with strict redaction; must never include auth headers or PII fields."
      }
    },
    "rateLimitingAndAbuse": {
      "gateway": "Global and per-tenant limits for public endpoints",
      "serviceSide": [
        "Per-tenant rate limit for sensitive endpoints (invites, search, payment initiation, webhooks).",
        "Invite spam protection via quotas and audits (DEC-012)."
      ]
    },
    "paymentSecurityPolicy": {
      "principle": "Avoid handling raw cardholder data; prefer hosted checkout/tokenization.",
      "rules": [
        "Never store or log PAN/CVV",
        "Verify webhook signatures",
        "Enforce idempotency on callbacks",
        "Webhook endpoint must validate provider signature before any processing"
      ]
    },
    "keyRotationRunbook": {
      "jwksCaching": {
        "cacheTtl": "PT10M",
        "failureMode": "Fail closed for protected operations if signature validation cannot be performed",
        "rotationHandling": "On key rotation, services refresh JWKS on signature failure once, then reject if still invalid"
      },
      "webhookSecrets": {
        "rotation": "Support dual-secret overlap window (old+new) for PT60M to avoid downtime",
        "storage": "Vault/K8s Secrets; never log"
      }
    },
    "dataAtRestEncryption": "All persistent data stores (databases and object storage) must use encryption at rest by default (e.g., cloud KMS, TDE, SSE-S3)."
  },
  "observability": {
    "logging": {
      "format": "Structured JSON logs",
      "requiredFields": ["timestamp", "level", "service", "env", "version", "traceId", "spanId", "requestId", "tenantId", "branchId"],
      "piiRule": "Mask identifiers; do not log sensitive data."
    },
    "tracing": { "tooling": "OpenTelemetry", "sampling": { "prod": "1-10% default; increase during incidents", "nonProd": "up to 100%" } },
    "metrics": {
      "tooling": "Actuator + Micrometer + Prometheus + Grafana",
      "examples": ["p95 latency", "error rate", "consumer lag", "DB pool saturation", "work order throughput"]
    },
    "slo": "See DEC-031",
    "healthChecks": "Liveness/readiness endpoints; K8s probes configured.",
    "audit": "Security and business audit events forwarded to AuditService; append-only and tamper-evident (DEC-032)."
  },
  "ciCdDeployment": {
    "repository": "Git with PR reviews and CI gates.",
    "ciPipeline": [
      "Build (Maven/Gradle)",
      "Unit tests",
      "Integration tests (Testcontainers)",
      "Contract tests (recommended for service boundaries)",
      "Docker image build + vulnerability scan",
      "Deploy to K8s with rolling updates"
    ],
    "testingStrategy": {
      "unitTests": [
        "Service-layer business rules",
        "DTO validation (validationCatalog constraints)",
        "Permission checks and tenant scoping helpers",
        "Ownership checks for CUSTOMER",
        "Idempotency key mismatch behavior (409) and replay behavior",
        "Invite token one-time/TTL behavior",
        "Soft delete + uniqueness behavior (409 on restore conflicts)",
        "Policy precedence and fail-safe behavior (DEC-008)",
        "Policy schema validation (DEC-023)",
        "Branch enforcement migration fail-closed behavior (DEC-020)",
        "File presign allowlist rules + tenant isolation prefix + encryption policy",
        "ETag/If-Match behavior (DEC-036)",
        "Plate normalization algorithm (DEC-034)",
        "Customer redirect resolution rules (DEC-039)",
        "Audit hash-chain generation and verification (DEC-032)"
      ],
      "integrationTests": [
        "Controller + DB + Security",
        "Kafka/RabbitMQ flows using Testcontainers",
        "Idempotency-Key atomicity behavior (DEC-025)",
        "Policy publish and cache invalidation behavior",
        "Policy simulation + canary publish behavior (DEC-035)",
        "Membership validation fallback behavior (DEC-015)",
        "Payment webhook signature verification + idempotency contract",
        "DLQ replay runbook simulation",
        "WorkOrder–Inventory saga happy-path + rejection + compensation (DEC-037)"
      ],
      "contractTests": [
        "BFF ↔ services",
        "WorkOrder ↔ Inventory saga events (DEC-037)",
        "Payment webhook idempotency contract",
        "Event catalog schema validation per topic",
        "BFF contracts (masked fields) remain backward compatible"
      ]
    },
    "secretsManagement": "K8s Secrets or Vault; rotate keys; never commit secrets.",
    "backupRecovery": "Scheduled backups + periodic restore tests; PITR where available.",
    "runbooks": {
      "dlqReplay": [
        "Identify failureType and consumerGroup from DLQ envelope",
        "Fix root cause; deploy patch",
        "Replay with same eventId; ensure consumer idempotency",
        "Audit replay action with counts and actor"
      ],
      "policyRollback": [
        "Republish prior policy version (DEC-002 rollback)",
        "If canary rollback: stop rollout and revert canary branches first",
        "Monitor 4xx/5xx rate and auth failures after rollback"
      ],
      "auditIntegrity": [
        "Run nightly hash-chain verification (DEC-032)",
        "On mismatch: alert, freeze audit export, escalate to security incident"
      ]
    }
  },
  "deliveryScope": {
    "principle": "Single coherent release scope with minimum mode first and configurable expansion (no hard-coded enterprise-only flows).",
    "mustHave": [
      "Fast intake (guest walk-in): customer + vehicle + work order in one screen",
      "Tenant/branch scoping (tenantId everywhere) and optional branch mode",
      "JWT claim standard and service-side enforcement for tenant/branch membership validation",
      "Service-to-service auth baseline (DEC-038)",
      "RBAC + permission overrides + custom roles (via TenantAdminService)",
      "Policy model: versioning + publish + audit + cache invalidation event + precedence/fail-safe rules",
      "Policy simulation + canary publish baseline (DEC-035)",
      "Concrete policy schemas (DEC-023) and strict validation behavior",
      "Invite + classic register + linking/dedupe + admin merge workflow + compensating unmerge + one-time invite token security",
      "Customer redirect resolution standard (DEC-039)",
      "Work order lifecycle with policy-driven required fields for enterprise tenants",
      "Custom sub-statuses mapped to canonical statuses for reporting",
      "Cash/offline payment recording (append-only transactions) + online payment integration point",
      "Invoice numbering + immutability after ISSUED",
      "Line item model for work order/invoice (optional in minimum mode, DEC-033)",
      "Audit logging of security and critical business actions + tamper-evident integrity (DEC-032) + 403 volume controls",
      "Outbox + idempotent consumers baseline for WorkOrder ↔ Inventory with DLQ strategy + replay safety",
      "WorkOrder–Inventory saga contract (DEC-037)",
      "Appointment check-in idempotency and appointment.workOrderId linkage + capacity/business hours baseline",
      "BFF read-model endpoints for UI composition + explicit response contracts + default masking",
      "API URL versioning (/v1) and deprecation baseline",
      "Optimistic concurrency via ETag/If-Match (DEC-036)",
      "File presign security baseline + storage isolation + encryption-at-rest policy support (FILE_SECURITY v2)",
      "Error code catalog usage (DEC-027)",
      "Plate normalization standard (DEC-034)"
    ],
    "niceToHave": [
      "Customer approval via link/SMS/email",
      "Templates/checklists (service templates, intake checklist)",
      "Partial payments/deposits and credit terms",
      "Import/export (CSV) for customer/vehicle/parts",
      "Enterprise reporting dashboards",
      "PWA offline-lite mode for draft intake queue (future, explicit design required)"
    ]
  },
  "blueprintEnhancements": {
    "note": "Additive enhancements applied without modifying existing sections (minimal-diff).",
    "enhancedAtUtc": "2026-01-11T12:00:00Z",
    "addedDecisions": ["DEC-040", "DEC-041", "DEC-042", "DEC-043", "DEC-044", "DEC-045", "DEC-046"],
    "addedSections": ["IdentityModel", "TenantAdminEntities", "EventCatalog", "StateMachines", "DataClassification", "AbuseControls"]
  },
  "IdentityModel": {
    "decisionRef": "DEC-040",
    "model": {
      "identityProvider": {
        "preferred": "Keycloak (OIDC)",
        "environments": ["dev", "test", "prod"],
        "token": {
          "accessToken": { "format": "JWT", "alg": "RS256", "lifetime": "PT10M default (configurable)" },
          "refreshToken": { "usage": "Frontends only; never forwarded to services; stored securely client-side", "lifetime": "IdP configured" }
        },
        "claims": {
          "required": ["sub", "tenant_id"],
          "optional": ["branch_id", "roles", "scope", "locale"],
          "audience": "aud must match target service"
        }
      },
      "applicationPrincipals": {
        "StaffPrincipal": {
          "description": "Human staff account used by OWNER/ADMIN/STAFF/MECHANIC.",
          "identityKey": "sub",
          "authorizationSource": "TenantAdminService membership + role/permissions",
          "branchScope": "branch_id claim may be required by tenant policy"
        },
        "CustomerPrincipal": {
          "description": "Customer self-service account.",
          "identityKey": "sub",
          "linking": "Maps to a single active Customer.associatedUserId per tenant by default",
          "authorizationSource": "Ownership checks + explicit permissions if granted"
        },
        "MachinePrincipal": {
          "description": "Client credentials identity for service-to-service calls.",
          "identityKey": "client_id",
          "authorizationSource": "Scopes + service-level allowlist of machine roles"
        }
      },
      "provisioningFlows": {
        "staffInviteFlow": {
          "initiatedBy": "OWNER/ADMIN",
          "steps": [
            "Create staff invite (token hashed at rest; no PII in token)",
            "User completes IdP registration or SSO",
            "TenantAdminService creates/activates membership and role assignments",
            "Audit every step; failures are compensated or require admin repair tool"
          ],
          "revocation": [
            "Disable membership immediately on termination",
            "Invalidate caches via MembershipUpdated/RoleAssignmentsUpdated events"
          ]
        },
        "customerRegisterFlow": {
          "modes": ["INVITE", "CLASSIC_REGISTER"],
          "dedupeLinking": [
            "Prefer phoneE164, then emailNormalized",
            "Never treat plate as identity",
            "Auto-link only if tenant policy allows and verification requirements are satisfied"
          ],
          "verification": {
            "baseline": "Verification optional in minimum mode; tenant policy may require it for sensitive operations (payments, DSAR, unmasked PII view)",
            "tokenHandling": "One-time, TTL-bound, hashed at rest, constant-time compare; never logged"
          }
        }
      }
    }
  },
  "TenantAdminEntities": {
    "decisionRef": "DEC-041",
    "entities": {
      "Tenant": {
        "fields": {
          "id": "UUID",
          "name": "String",
          "segment": "SOLO_SMALL|SMB|ENTERPRISE",
          "defaultLocale": "String (IETF BCP 47, e.g., tr-TR)",
          "defaultCurrency": "String (ISO 4217)",
          "branchRequired": "Boolean",
          "strictPolicyValidationDefault": "Boolean",
          "status": "ACTIVE|SUSPENDED",
          "version": "Long",
          "createdAt": "UTC",
          "updatedAt": "UTC",
          "isDeleted": "Boolean"
        },
        "invariants": [
          "status=SUSPENDED => protected writes fail closed across services",
          "branchRequired implies branch_id claim must be present and membership must be branch-scoped"
        ]
      },
      "Branch": {
        "fields": {
          "id": "UUID",
          "tenantId": "UUID",
          "code": "String (2..12, uppercase, unique per tenant)",
          "name": "String",
          "timezone": "IANA timezone (required if appointments enabled)",
          "status": "ACTIVE|INACTIVE",
          "version": "Long",
          "createdAt": "UTC",
          "updatedAt": "UTC",
          "isDeleted": "Boolean"
        }
      },
      "Role": {
        "fields": {
          "id": "UUID",
          "tenantId": "UUID",
          "name": "String",
          "type": "SYSTEM|CUSTOM",
          "permissions": "Array<String> from permissionCatalog",
          "status": "ACTIVE|INACTIVE",
          "version": "Long",
          "createdAt": "UTC",
          "updatedAt": "UTC",
          "isDeleted": "Boolean"
        }
      },
      "RoleAssignment": {
        "fields": {
          "id": "UUID",
          "tenantId": "UUID",
          "branchId": "UUID (optional)",
          "userId": "String (Identity sub)",
          "roleId": "UUID",
          "effectiveFrom": "UTC",
          "effectiveTo": "UTC (optional)",
          "createdAt": "UTC"
        }
      },
      "TenantMembership": {
        "fields": {
          "id": "UUID",
          "tenantId": "UUID",
          "branchId": "UUID (optional)",
          "userId": "String (Identity sub)",
          "status": "ACTIVE|REVOKED",
          "version": "Long",
          "createdAt": "UTC",
          "updatedAt": "UTC"
        }
      },
      "PolicyRecord": {
        "fields": {
          "id": "UUID",
          "tenantId": "UUID",
          "branchId": "UUID (optional)",
          "category": "String",
          "schemaVersion": "Integer",
          "policyVersion": "Integer (monotonic)",
          "effectiveFrom": "UTC",
          "publishedAt": "UTC (optional)",
          "status": "DRAFT|PUBLISHED|ARCHIVED",
          "payload": "JSON",
          "payloadHash": "SHA-256",
          "createdByUserId": "UUID",
          "version": "Long",
          "createdAt": "UTC",
          "updatedAt": "UTC"
        }
      }
    },
    "apiStandards": {
      "etagIfMatch": "Required for all mutable operations (DEC-036).",
      "audit": "All changes audited and tamper-evident (DEC-032).",
      "events": ["TenantUpdated", "BranchUpdated", "RoleUpdated", "RoleAssignmentsUpdated", "PolicyUpdated"]
    }
  },
  "EventCatalog": {
    "decisionRef": "DEC-042",
    "catalogSchema": {
      "requiredFields": ["eventType", "eventVersion", "producer", "aggregateType", "partitionKeyStrategy", "piiClass", "schemaRef"],
      "fields": {
        "eventType": "String",
        "eventVersion": "Integer",
        "producer": "String (service name)",
        "aggregateType": "String",
        "partitionKeyStrategy": "String (e.g., tenantId:aggregateId)",
        "piiClass": "NONE|MASKED|PII_ALLOWED",
        "schemaRef": "String (path/id in schema registry)",
        "compatibility": "BACKWARD",
        "notes": "String (optional)"
      }
    },
    "baselineEvents": [
      { "eventType": "TenantUpdated", "eventVersion": 1, "producer": "TenantAdminService", "aggregateType": "Tenant", "partitionKeyStrategy": "tenantId:tenantId", "piiClass": "NONE", "schemaRef": "tenantadmin.events.v1/TenantUpdated@1" },
      { "eventType": "PolicyUpdated", "eventVersion": 1, "producer": "TenantAdminService", "aggregateType": "PolicyRecord", "partitionKeyStrategy": "tenantId:category", "piiClass": "NONE", "schemaRef": "tenantadmin.events.v1/PolicyUpdated@1" },
      { "eventType": "RoleAssignmentsUpdated", "eventVersion": 1, "producer": "TenantAdminService", "aggregateType": "RoleAssignment", "partitionKeyStrategy": "tenantId:userId", "piiClass": "NONE", "schemaRef": "tenantadmin.events.v1/RoleAssignmentsUpdated@1" },
      { "eventType": "CustomerCreated", "eventVersion": 1, "producer": "CustomerService", "aggregateType": "Customer", "partitionKeyStrategy": "tenantId:customerId", "piiClass": "NONE", "schemaRef": "customer.events.v1/CustomerCreated@1" },
      { "eventType": "CustomerMerged", "eventVersion": 1, "producer": "CustomerService", "aggregateType": "Customer", "partitionKeyStrategy": "tenantId:customerId", "piiClass": "NONE", "schemaRef": "customer.events.v1/CustomerMerged@1" },
      { "eventType": "CustomerUnmerged", "eventVersion": 1, "producer": "CustomerService", "aggregateType": "Customer", "partitionKeyStrategy": "tenantId:customerId", "piiClass": "NONE", "schemaRef": "customer.events.v1/CustomerUnmerged@1" },
      { "eventType": "VehicleCreated", "eventVersion": 1, "producer": "VehicleService", "aggregateType": "Vehicle", "partitionKeyStrategy": "tenantId:vehicleId", "piiClass": "NONE", "schemaRef": "vehicle.events.v1/VehicleCreated@1" },
      { "eventType": "WorkOrderCreated", "eventVersion": 1, "producer": "WorkOrderService", "aggregateType": "WorkOrder", "partitionKeyStrategy": "tenantId:workOrderId", "piiClass": "NONE", "schemaRef": "workorder.events.v1/WorkOrderCreated@1" },
      { "eventType": "WorkOrderStatusChanged", "eventVersion": 1, "producer": "WorkOrderService", "aggregateType": "WorkOrder", "partitionKeyStrategy": "tenantId:workOrderId", "piiClass": "NONE", "schemaRef": "workorder.events.v1/WorkOrderStatusChanged@1" },
      { "eventType": "InvoiceIssued", "eventVersion": 1, "producer": "PaymentService", "aggregateType": "Invoice", "partitionKeyStrategy": "tenantId:invoiceId", "piiClass": "NONE", "schemaRef": "payment.events.v1/InvoiceIssued@1" },
      { "eventType": "PaymentRecorded", "eventVersion": 1, "producer": "PaymentService", "aggregateType": "Invoice", "partitionKeyStrategy": "tenantId:invoiceId", "piiClass": "NONE", "schemaRef": "payment.events.v1/PaymentRecorded@1" },
      { "eventType": "PartsReservationRequested", "eventVersion": 1, "producer": "WorkOrderService", "aggregateType": "WorkOrder", "partitionKeyStrategy": "tenantId:workOrderId", "piiClass": "NONE", "schemaRef": "inventory.events.v1/PartsReservationRequested@1" },
      { "eventType": "PartsReserved", "eventVersion": 1, "producer": "InventoryService", "aggregateType": "PartsReservation", "partitionKeyStrategy": "tenantId:reservationId", "piiClass": "NONE", "schemaRef": "inventory.events.v1/PartsReserved@1" },
      { "eventType": "PartsReservationRejected", "eventVersion": 1, "producer": "InventoryService", "aggregateType": "PartsReservation", "partitionKeyStrategy": "tenantId:reservationId", "piiClass": "NONE", "schemaRef": "inventory.events.v1/PartsReservationRejected@1" }
    ],
    "publishingSemantics": {
      "outbox": {
        "required": true,
        "pollingIntervalDefault": "PT1S",
        "batchSizeDefault": 100,
        "retryBackoff": "Exponential with jitter"
      },
      "consumerDedup": {
        "required": true,
        "store": "ProcessedEvent",
        "key": "(tenantId, eventId, consumerGroup)"
      }
    }
  },
  "StateMachines": {
    "decisionRef": "DEC-043",
    "WorkOrder": {
      "canonicalStatuses": ["DRAFT", "OPEN", "IN_PROGRESS", "WAITING_CUSTOMER_APPROVAL", "COMPLETED", "CANCELED"],
      "terminalStatuses": ["COMPLETED", "CANCELED"],
      "allowedTransitionsBaseline": [
        { "from": "DRAFT", "to": "OPEN" },
        { "from": "OPEN", "to": "IN_PROGRESS" },
        { "from": "IN_PROGRESS", "to": "WAITING_CUSTOMER_APPROVAL" },
        { "from": "WAITING_CUSTOMER_APPROVAL", "to": "IN_PROGRESS" },
        { "from": "IN_PROGRESS", "to": "COMPLETED" },
        { "from": "OPEN", "to": "CANCELED" },
        { "from": "IN_PROGRESS", "to": "CANCELED" },
        { "from": "WAITING_CUSTOMER_APPROVAL", "to": "CANCELED" }
      ],
      "transitionGuards": [
        "Policy REQUIRED_FIELDS may require specific fields before transition",
        "Approval rules may require approval record for guarded transitions",
        "Invoice requirement may block COMPLETED when policy requires invoice (DEC-022)"
      ],
      "events": ["WorkOrderCreated", "WorkOrderStatusChanged"]
    },
    "Invoice": {
      "statuses": ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELED"],
      "terminalStatuses": ["PAID", "CANCELED"],
      "allowedTransitionsBaseline": [
        { "from": "DRAFT", "to": "ISSUED" },
        { "from": "ISSUED", "to": "PARTIALLY_PAID" },
        { "from": "ISSUED", "to": "PAID" },
        { "from": "ISSUED", "to": "OVERDUE" },
        { "from": "PARTIALLY_PAID", "to": "PAID" },
        { "from": "OVERDUE", "to": "PAID" },
        { "from": "DRAFT", "to": "CANCELED" }
      ],
      "immutabilityAfterIssued": true,
      "events": ["InvoiceIssued", "PaymentRecorded"]
    }
  },
  "DataClassification": {
    "decisionRef": "DEC-044",
    "labels": ["AUTH_SECRET", "PII", "FINANCIAL", "SENSITIVE_NOTES", "OPERATIONAL"],
    "rules": {
      "logs": "Mask PII; never log AUTH_SECRET; avoid SENSITIVE_NOTES unless explicitly enabled with strict redaction and never in prod.",
      "events": "IDs only by default; PII forbidden unless EventCatalog piiClass allows it.",
      "idempotency": "Response snapshot must not contain PII; use allowedResponseFields (DEC-011).",
      "apiResponses": "Mask PII by default; full PII requires CUSTOMER_PII_READ and explicit endpoint contract (DEC-018).",
      "dsar": "Export/anonymize per DEC-030; retention constraints per DEC-007."
    },
    "entityFieldClassification": {
      "Customer": {
        "PII": ["fullName", "phoneE164", "emailNormalized", "address"],
        "SENSITIVE_NOTES": ["notes"],
        "OPERATIONAL": ["type", "status", "associatedUserId", "mergedIntoCustomerId", "phoneVerified", "emailVerified", "anonymizedAt"]
      },
      "Vehicle": {
        "PII": ["rawPlate", "normalizedPlate", "vin", "engineNo"],
        "SENSITIVE_NOTES": ["notes"],
        "OPERATIONAL": ["make", "model", "year", "mileage", "customerId", "status"]
      },
      "WorkOrder": {
        "SENSITIVE_NOTES": ["problemShortNote", "problemDetails", "diagnosticsNotes"],
        "FINANCIAL": ["pricingSnapshot"],
        "OPERATIONAL": ["status", "subStatus", "assignedToUserId", "invoiceId", "completedAt", "flags", "customerId", "vehicleId"]
      },
      "Invoice": {
        "FINANCIAL": ["amountSubtotal", "amountTax", "amountDiscount", "amountTotal", "currency", "dueDate", "issuedAt"],
        "OPERATIONAL": ["status", "invoiceNumber", "workOrderId", "customerId"]
      }
    }
  },
  "AbuseControls": {
    "decisionRef": "DEC-045",
    "principles": [
      "Layered controls (gateway + service)",
      "Replay prevention for one-time tokens and webhooks",
      "Enumeration resistance on search endpoints",
      "Fail-closed when verification cannot be performed"
    ],
    "controls": {
      "invites": {
        "tokenSecurity": "One-time, TTL, hashed at rest, constant-time compare; never logged (DEC-012).",
        "throttling": { "ip": "Gateway enforced", "perTenant": "Quotas + rate limits", "audit": "All attempts audited with hashes only" }
      },
      "search": {
        "minQueryLength": "Enforced (DEC-028)",
        "rateLimits": "Per actor + adaptive throttling",
        "enumerationDetection": ["High distinct queries", "High 404 rate", "Repeated near-miss patterns"],
        "responseHardening": "Avoid responses that confirm existence beyond authorized scope"
      },
      "webhooks": {
        "signature": "Verify before processing",
        "timestampSkew": "±5 minutes default",
        "replayStore": "providerEventId dedupe with TTL P30D",
        "idempotency": "Apply DEC-004/DEC-025 semantics"
      }
    }
  }
}

<<<BLUEPRINT_JSON_END>>>