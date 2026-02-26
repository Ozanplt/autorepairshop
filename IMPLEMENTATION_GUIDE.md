# Complete Implementation Guide

## Overview

This document provides the complete implementation guidance for the AutoRepairShop Management System monorepo. Due to the size of the codebase (12 microservices + frontend + infrastructure), this guide provides templates and patterns to complete the implementation.

## What's Already Created

✅ Core documentation (ARCHITECTURE.md, SECURITY.md, RUNBOOK.md, DECISIONS.md, API_GUIDE.md, UX_MINIMUM_MODE.md)
✅ Infrastructure configuration (docker-compose.yml, Keycloak realm, Prometheus, Grafana)
✅ Root pom.xml with all modules
✅ Scripts (dev-up.sh, dev-down.sh, wait-for.sh)
✅ Common libraries structure (common-security, common-error)

## What Needs to Be Generated

### Remaining Common Libraries

Each library follows this structure:

```
libs/{library-name}/
├── pom.xml
└── src/main/java/com/autorepair/common/{library}/
    └── [implementation files]
```

#### common-idempotency
Files needed:
- `IdempotencyService.java` - Store and validate idempotency keys
- `IdempotencyRecord.java` - JPA entity
- `IdempotencyInterceptor.java` - HTTP interceptor
- `IdempotencyRepository.java` - Spring Data repository

Key logic:
```java
public class IdempotencyService {
    public Optional<StoredResponse> check(UUID tenantId, String key, String requestHash) {
        // Query: SELECT * FROM idempotency_record WHERE tenant_id=? AND idempotency_key=?
        // If exists and requestHash differs: throw 409
        // If exists and requestHash matches: return stored response
        // Else: return empty
    }
    
    public void store(UUID tenantId, String key, String requestHash, int status, String body) {
        // INSERT with unique constraint on (tenant_id, idempotency_key, endpoint_key)
    }
}
```

#### common-outbox
Files needed:
- `OutboxEvent.java` - JPA entity with fields: id, tenantId, eventType, payload, publishedAt, status
- `OutboxPublisher.java` - Scheduled job to poll and publish
- `OutboxRepository.java` - Spring Data repository

Key logic:
```java
@Scheduled(fixedDelay = 1000)
public void publishEvents() {
    List<OutboxEvent> pending = repository.findByStatusAndLimit("PENDING", 100);
    for (OutboxEvent event : pending) {
        kafkaTemplate.send(event.getTopic(), event.getPayload());
        event.setStatus("PUBLISHED");
        event.setPublishedAt(Instant.now());
        repository.save(event);
    }
}
```

#### common-events
Files needed:
- `EventEnvelope.java` - Wrapper for all events
- `ProcessedEvent.java` - JPA entity for dedupe
- `EventConsumer.java` - Base class for consumers

#### common-pii
Files needed:
- `MaskingUtil.java` - Phone/email masking
- `DataClassification.java` - Annotation for PII fields

#### common-etag
Files needed:
- `ETagInterceptor.java` - Generate ETag from version
- `Versionable.java` - Interface for versioned entities

### Microservices Implementation Pattern

Each service follows this structure:

```
services/{service-name}/
├── pom.xml
├── Dockerfile
└── src/
    ├── main/
    │   ├── java/com/autorepair/{service}/
    │   │   ├── {Service}Application.java
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── repository/
    │   │   ├── domain/
    │   │   ├── dto/
    │   │   └── mapper/
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       └── db/migration/
    │           ├── V1__init_schema.sql
    │           ├── V2__add_idempotency.sql
    │           ├── V3__add_outbox.sql
    │           └── V4__add_processed_events.sql
    └── test/
        └── java/com/autorepair/{service}/
```

### Sample Service: WorkOrder Service

#### pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <parent>
        <groupId>com.autorepair</groupId>
        <artifactId>autorepairshop-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    
    <artifactId>workorder-service</artifactId>
    
    <dependencies>
        <dependency>
            <groupId>com.autorepair</groupId>
            <artifactId>common-security</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.autorepair</groupId>
            <artifactId>common-error</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.autorepair</groupId>
            <artifactId>common-idempotency</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.autorepair</groupId>
            <artifactId>common-outbox</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### application.yml
```yaml
spring:
  application:
    name: workorder-service
  datasource:
    url: jdbc:postgresql://localhost:5432/workorder_db
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    baseline-on-migrate: true
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: workorder-service
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:9080/realms/autorepairshop
          jwk-set-uri: http://localhost:9080/realms/autorepairshop/protocol/openid-connect/certs

server:
  port: 8084

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

#### Domain Entity: WorkOrder.java
```java
package com.autorepair.workorder.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
@Data
public class WorkOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID tenantId;
    
    private UUID branchId;
    
    @Column(nullable = false)
    private UUID customerId;
    
    @Column(nullable = false)
    private UUID vehicleId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderStatus status;
    
    private String subStatus;
    private String problemShortNote;
    
    @Column(length = 4000)
    private String problemDetails;
    
    private UUID assignedToUserId;
    private Integer intakeMileage;
    
    @Column(length = 4000)
    private String diagnosticsNotes;
    
    @Column(length = 3)
    private String currency;
    
    private UUID invoiceId;
    private Instant completedAt;
    
    @Column(columnDefinition = "jsonb")
    private String pricingSnapshot;
    
    @Column(columnDefinition = "jsonb")
    private String flags;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    private UUID createdByUserId;
    private UUID updatedByUserId;
    
    @Column(nullable = false)
    private Boolean isDeleted = false;
    
    private Instant deletedAt;
    
    @Version
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

#### Repository
```java
package com.autorepair.workorder.repository;

import com.autorepair.workorder.domain.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.UUID;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {
    @Query("SELECT w FROM WorkOrder w WHERE w.id = :id AND w.tenantId = :tenantId AND w.isDeleted = false")
    Optional<WorkOrder> findByIdAndTenantId(UUID id, UUID tenantId);
}
```

#### Service
```java
package com.autorepair.workorder.service;

import com.autorepair.common.error.BusinessException;
import com.autorepair.common.security.TenantContext;
import com.autorepair.workorder.domain.WorkOrder;
import com.autorepair.workorder.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkOrderService {
    private final WorkOrderRepository repository;
    
    @Transactional(readOnly = true)
    public WorkOrder findById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> BusinessException.notFound("Work order not found"));
    }
    
    @Transactional
    public WorkOrder create(WorkOrder workOrder) {
        workOrder.setTenantId(TenantContext.getTenantId());
        workOrder.setBranchId(TenantContext.getBranchId());
        workOrder.setCreatedByUserId(UUID.fromString(TenantContext.getUserId()));
        return repository.save(workOrder);
    }
}
```

#### Controller
```java
package com.autorepair.workorder.controller;

import com.autorepair.workorder.dto.WorkOrderDto;
import com.autorepair.workorder.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/v1/workorders")
@RequiredArgsConstructor
public class WorkOrderController {
    private final WorkOrderService service;
    
    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderDto> getById(@PathVariable UUID id) {
        // Implementation
        return ResponseEntity.ok(null);
    }
    
    @PostMapping
    public ResponseEntity<WorkOrderDto> create(
            @Valid @RequestBody WorkOrderDto dto,
            @RequestHeader("Idempotency-Key") String idempotencyKey) {
        // Implementation with idempotency check
        return ResponseEntity.ok(null);
    }
}
```

#### Flyway Migration: V1__init_schema.sql
```sql
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
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_work_orders_status ON work_orders(status) WHERE is_deleted = FALSE;
```

### Frontend Implementation

#### package.json
```json
{
  "name": "autorepairshop-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-oidc-context": "^2.3.1",
    "i18next": "^23.7.6",
    "react-i18next": "^13.5.0",
    "axios": "^1.6.2",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
```

#### src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from 'react-oidc-context'
import App from './App'
import './i18n'

const oidcConfig = {
  authority: 'http://localhost:9080/realms/autorepairshop',
  client_id: 'frontend',
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
```

#### src/api/client.ts
```typescript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Request-Id'] = crypto.randomUUID()
  return config
})

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Kubernetes Manifests

#### infra/k8s/base/workorder-service.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: workorder-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: workorder-service
  template:
    metadata:
      labels:
        app: workorder-service
    spec:
      containers:
      - name: workorder-service
        image: autorepairshop/workorder-service:latest
        ports:
        - containerPort: 8084
        env:
        - name: SPRING_DATASOURCE_URL
          value: jdbc:postgresql://postgres:5432/workorder_db
        - name: SPRING_KAFKA_BOOTSTRAP_SERVERS
          value: kafka:9092
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8084
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8084
          initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: workorder-service
spec:
  selector:
    app: workorder-service
  ports:
  - port: 8084
    targetPort: 8084
```

### GitHub Actions CI/CD

#### .github/workflows/build.yml
```yaml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Build with Maven
      run: ./mvnw clean install
    
    - name: Run tests
      run: ./mvnw test
    
    - name: Build Docker images
      run: |
        for service in gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff; do
          docker build -t autorepairshop/${service}-service:latest services/${service}-service/
        done
```

## Next Steps to Complete Implementation

1. **Generate all common libraries** following the patterns above
2. **Generate all 12 microservices** using the WorkOrder service as template
3. **Create all Flyway migrations** for each service
4. **Implement frontend pages** (Login, FastIntake, WorkOrders, Customers, etc.)
5. **Create all Kubernetes manifests** for each service
6. **Set up CI/CD pipelines** for automated builds and deployments

## Testing Strategy

Each service should have:
- Unit tests for business logic
- Integration tests with Testcontainers
- Contract tests for API endpoints
- End-to-end tests for critical flows

## Build Commands

```bash
# Build all services
./mvnw clean install

# Build specific service
./mvnw clean install -pl services/workorder-service -am

# Run tests
./mvnw test

# Build Docker images
docker-compose -f infra/docker-compose.yml build

# Start everything
./scripts/dev-up.sh
```

This guide provides the complete blueprint for implementing the entire monorepo. Each service follows the same patterns with service-specific business logic.
