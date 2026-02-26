# API Guide

## Base URLs

- **Gateway**: http://localhost:8080
- **Direct Service Access** (dev only): http://localhost:808X (where X is service port)

## Authentication

All requests require JWT Bearer token:

```bash
Authorization: Bearer <access_token>
```

Get token from Keycloak:
```bash
curl -X POST http://localhost:9080/realms/autorepairshop/protocol/openid-connect/token \
  -d "client_id=frontend" \
  -d "username=owner@demo.com" \
  -d "password=password123" \
  -d "grant_type=password"
```

## Common Headers

```
Authorization: Bearer <token>
Content-Type: application/json
X-Request-Id: <uuid>              # Optional, for tracing
Idempotency-Key: <uuid>           # Required for create operations
If-Match: W/"<version>"           # Required for updates
```

## Error Response Format

```json
{
  "timestamp": "2026-01-11T12:00:00Z",
  "requestId": "abc-123",
  "errorId": "err-456",
  "errorCode": "ERR_VALIDATION_FAILED",
  "message": "Validation failed",
  "messageKey": "error.validation.failed",
  "details": [
    {
      "field": "licensePlate",
      "message": "License plate is required"
    }
  ]
}
```

## Error Codes

- `ERR_AUTH_UNAUTHORIZED` - Invalid/expired token
- `ERR_AUTH_FORBIDDEN` - Insufficient permissions
- `ERR_AUTH_TENANT_MISSING` - Missing tenant_id claim
- `ERR_AUTH_BRANCH_REQUIRED` - Missing branch_id when required
- `ERR_VALIDATION_FAILED` - Request validation failed
- `ERR_RESOURCE_NOT_FOUND` - Resource not found
- `ERR_RESOURCE_CONFLICT` - Version conflict or duplicate
- `ERR_IDEMPOTENCY_HASH_MISMATCH` - Same key, different payload
- `ERR_PRECONDITION_REQUIRED` - Missing If-Match header
- `ERR_RATE_LIMITED` - Rate limit exceeded

## Pagination

```
GET /v1/workorders?page=0&size=20&sort=createdAt,desc
```

Response:
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5
}
```

## Fast Intake (Walk-In Customer)

Create customer + vehicle + work order in one request:

```bash
POST /v1/workorders/fast-intake
Idempotency-Key: <uuid>

{
  "customer": {
    "fullName": "John Doe",
    "phoneE164": "+905551234567"
  },
  "vehicle": {
    "rawPlate": "34 ABC 123",
    "make": "Toyota",
    "model": "Corolla"
  },
  "workOrder": {
    "problemShortNote": "Engine noise"
  }
}
```

Response:
```json
{
  "workOrderId": "uuid",
  "customerId": "uuid",
  "vehicleId": "uuid",
  "status": "DRAFT"
}
```

## Work Order Lifecycle

### Create Work Order
```bash
POST /v1/workorders
Idempotency-Key: <uuid>

{
  "customerId": "uuid",
  "vehicleId": "uuid",
  "problemShortNote": "Engine noise",
  "problemDetails": "Loud noise when accelerating"
}
```

### Get Work Order
```bash
GET /v1/workorders/{id}
```

Response includes ETag:
```
ETag: W/"1"
```

### Update Work Order
```bash
PUT /v1/workorders/{id}
If-Match: W/"1"

{
  "problemDetails": "Updated description",
  "assignedToUserId": "uuid"
}
```

### Change Status
```bash
POST /v1/workorders/{id}/status
If-Match: W/"1"

{
  "status": "IN_PROGRESS",
  "notes": "Started work"
}
```

## Customer Management

### Create Customer
```bash
POST /v1/customers
Idempotency-Key: <uuid>

{
  "type": "GUEST",
  "fullName": "Jane Smith",
  "phoneE164": "+905559876543",
  "emailNormalized": "jane@example.com"
}
```

### Search Customers
```bash
GET /v1/customers/search?q=jane&page=0&size=20
```

### Merge Customers
```bash
POST /v1/customers/{sourceId}/merge
If-Match: W/"1"

{
  "targetCustomerId": "uuid",
  "reason": "Duplicate detected"
}
```

## Vehicle Management

### Search by Plate
```bash
GET /v1/vehicles/search?plate=34ABC123
```

### Create Vehicle
```bash
POST /v1/vehicles
Idempotency-Key: <uuid>

{
  "customerId": "uuid",
  "rawPlate": "34 ABC 123",
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020
}
```

## Invoice & Payment

### Create Invoice
```bash
POST /v1/invoices
Idempotency-Key: <uuid>

{
  "workOrderId": "uuid",
  "customerId": "uuid",
  "currency": "TRY",
  "lineItems": [
    {
      "type": "LABOR",
      "name": "Engine repair",
      "quantity": 2,
      "unitPrice": 500.00
    }
  ]
}
```

### Issue Invoice
```bash
POST /v1/invoices/{id}/issue
If-Match: W/"1"
```

### Record Cash Payment
```bash
POST /v1/payments
Idempotency-Key: <uuid>

{
  "invoiceId": "uuid",
  "method": "CASH",
  "amount": 1000.00,
  "currency": "TRY",
  "receiptNumber": "RCP-001"
}
```

## Appointments

### Get Available Slots
```bash
GET /v1/appointments/slots?branchId=uuid&date=2026-01-15
```

### Book Appointment
```bash
POST /v1/appointments
Idempotency-Key: <uuid>

{
  "customerId": "uuid",
  "vehicleId": "uuid",
  "branchId": "uuid",
  "scheduledAt": "2026-01-15T10:00:00Z",
  "notes": "Regular maintenance"
}
```

### Check-In Appointment
```bash
POST /v1/appointments/{id}/checkin
Idempotency-Key: <uuid>
```

## Query BFF (Composite Queries)

### Get Work Order with Details
```bash
GET /v1/query/workorders/{id}
```

Response includes customer, vehicle, invoice (PII masked by default):
```json
{
  "workOrder": {...},
  "customer": {
    "id": "uuid",
    "fullName": "John Doe",
    "phoneE164": "*******567",
    "emailNormalized": "j***@e***.com"
  },
  "vehicle": {...},
  "invoice": {...}
}
```

### Dashboard Summary
```bash
GET /v1/query/dashboard?branchId=uuid&from=2026-01-01&to=2026-01-31
```

## OpenAPI Specs

Each service exposes:
- `/v3/api-docs` - OpenAPI JSON
- `/swagger-ui.html` - Swagger UI

Exported specs available in `docs/openapi/` directory.
