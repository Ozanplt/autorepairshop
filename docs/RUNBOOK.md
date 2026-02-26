# Operational Runbook

## Starting the System

### Local Development
```bash
./scripts/dev-up.sh
```

### Kubernetes
```bash
kubectl apply -k infra/k8s/overlays/dev
kubectl get pods -n autorepairshop-dev
```

## Health Checks

All services expose:
- `/actuator/health/liveness` - Pod is alive
- `/actuator/health/readiness` - Pod is ready
- `/actuator/metrics` - Prometheus metrics
- `/actuator/info` - Build info

## Common Operations

### DLQ Replay (Saga Failures)
```bash
# 1. Identify failed events
kafka-console-consumer --bootstrap-server localhost:9092 --topic inventory.events.v1.dlq

# 2. Fix root cause, deploy patch

# 3. Replay events (consumers are idempotent)
```

### Policy Rollback
```bash
# 1. Get prior policy version
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/v1/policies?category=REQUIRED_FIELDS

# 2. Republish prior version
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/v1/policies/{policyId}/publish

# 3. Monitor 4xx/5xx rates
```

### Membership Revocation
```bash
# Revoke membership immediately
curl -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8081/v1/memberships/{membershipId}

# Services invalidate cache (TTL=PT2M)
```

### Audit Integrity Verification
```bash
# Nightly job verifies hash chain
# On mismatch: alert, freeze export, escalate
```

## Monitoring

### Grafana Dashboards
- Service Overview: latency, error rate, JVM metrics
- Business Metrics: work orders, invoices, payments

### Key Alerts
- High error rate (>5% 5xx)
- High latency (p95 > 1s)
- Kafka consumer lag (>1000 messages)
- Database connection pool exhaustion

## Backup & Restore

### Postgres
```bash
# Backup
kubectl exec postgres-pod -- pg_dumpall -U postgres > backup.sql

# Restore
kubectl exec -i postgres-pod -- psql -U postgres < backup.sql
```

### MinIO
```bash
mc mirror minio/autorepairshop s3/backup-bucket/
```

## Incident Response

### High Error Rate
1. Check Grafana: identify failing service
2. Check logs: `kubectl logs -f deployment/{service}`
3. Rollback if recent deploy: `kubectl rollout undo deployment/{service}`
4. Scale up if load spike: `kubectl scale deployment/{service} --replicas=5`

### Kafka Consumer Lag
1. Check Grafana: consumer lag metric
2. Scale consumer pods: `kubectl scale deployment/{service} --replicas=3`
3. Check for slow processing: review logs
