# Production Deployment - Single TODO Checklist

## 🚀 DEPLOY TO PRODUCTION - COMPLETE THIS LIST

### PHASE 1: Pre-Deployment Configuration (30 minutes)

#### ✅ Step 1: Configure Production Secrets
```bash
# Copy template and fill in YOUR production values
cp PRODUCTION_ENV_TEMPLATE.env prod.env

# Edit prod.env and replace ALL "CHANGE_THIS" and "your-domain.com" values:
# - DB_PASSWORD: Use strong password (min 16 chars)
# - KEYCLOAK_ADMIN_PASSWORD: Use strong password
# - All client secrets: Generate random strings
# - All URLs: Replace with your actual domain names
# - MINIO credentials: Use strong keys
```

**Required Changes in prod.env:**
- [ ] DB_PASSWORD changed from default
- [ ] KEYCLOAK_ADMIN_PASSWORD changed from default
- [ ] All GATEWAY/SVC secrets changed
- [ ] MINIO_ACCESS_KEY and MINIO_SECRET_KEY changed
- [ ] All "your-domain.com" replaced with actual domains
- [ ] FRONTEND_URL set to production URL
- [ ] VITE_API_BASE_URL set to production API URL

---

#### ✅ Step 2: Update Keycloak Realm for Production
```bash
# Edit infra/keycloak/realm-export.json
```

**Required Changes:**
- [ ] Line 4: Change `"sslRequired": "none"` to `"sslRequired": "external"`
- [ ] Line 16: Update redirectUris to production URLs (remove localhost)
- [ ] Line 17: Update webOrigins to production URLs (remove localhost)
- [ ] Line 30: Change client secret from "gateway-secret-change-in-prod"

---

#### ✅ Step 3: Update Gateway CORS Configuration
```bash
# Edit services/gateway-service/src/main/resources/application.yml
```

**Required Changes:**
- [ ] Lines 101-103: Replace localhost URLs with production frontend URL
- [ ] Example: Change to `["https://app.your-domain.com"]`

---

### PHASE 2: Build & Push Images (20 minutes)

#### ✅ Step 4: Build All Services
```bash
cd c:/Users/ozan.polat/Desktop/repair
./mvnw clean install -DskipTests
```
- [ ] Build completed successfully
- [ ] All 12 services built without errors

---

#### ✅ Step 5: Build Docker Images
```bash
# Set version tag
VERSION=$(git rev-parse --short HEAD)

# Build all service images
for service in gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff; do
  cd services/${service}-service
  docker build -t autorepairshop/${service}-service:${VERSION} .
  docker tag autorepairshop/${service}-service:${VERSION} autorepairshop/${service}-service:latest
  cd ../..
done
```
- [ ] All 12 Docker images built
- [ ] Images tagged with version and latest

---

#### ✅ Step 6: Push to Container Registry
```bash
# Login to your container registry (Docker Hub, ECR, GCR, ACR)
docker login

# Push all images
for service in gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff; do
  docker push autorepairshop/${service}-service:${VERSION}
  docker push autorepairshop/${service}-service:latest
done
```
- [ ] Logged into container registry
- [ ] All images pushed successfully

---

### PHASE 3: Kubernetes Deployment (30 minutes)

#### ✅ Step 7: Create Production Namespace
```bash
kubectl create namespace autorepairshop-prod
kubectl config set-context --current --namespace=autorepairshop-prod
```
- [ ] Namespace created
- [ ] Context switched to production namespace

---

#### ✅ Step 8: Create Kubernetes Secrets
```bash
# Create database credentials secret
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=YOUR_DB_PASSWORD \
  -n autorepairshop-prod

# Create application secrets from your prod.env file
kubectl create secret generic app-secrets \
  --from-env-file=prod.env \
  -n autorepairshop-prod

# Create Keycloak admin secret
kubectl create secret generic keycloak-admin \
  --from-literal=password=YOUR_KEYCLOAK_ADMIN_PASSWORD \
  -n autorepairshop-prod

# Create MinIO credentials secret
kubectl create secret generic minio-credentials \
  --from-literal=access-key=YOUR_MINIO_ACCESS_KEY \
  --from-literal=secret-key=YOUR_MINIO_SECRET_KEY \
  -n autorepairshop-prod
```
- [ ] db-credentials secret created
- [ ] app-secrets secret created
- [ ] keycloak-admin secret created
- [ ] minio-credentials secret created

---

#### ✅ Step 9: Deploy Infrastructure Services
```bash
# Deploy in order (wait for each to be ready)
kubectl apply -f infra/k8s/base/postgres.yaml -n autorepairshop-prod
kubectl wait --for=condition=ready pod -l app=postgres -n autorepairshop-prod --timeout=300s

kubectl apply -f infra/k8s/base/kafka.yaml -n autorepairshop-prod
kubectl wait --for=condition=ready pod -l app=kafka -n autorepairshop-prod --timeout=300s

kubectl apply -f infra/k8s/base/keycloak.yaml -n autorepairshop-prod
kubectl wait --for=condition=ready pod -l app=keycloak -n autorepairshop-prod --timeout=300s

kubectl apply -f infra/k8s/base/minio.yaml -n autorepairshop-prod
kubectl wait --for=condition=ready pod -l app=minio -n autorepairshop-prod --timeout=300s
```
- [ ] PostgreSQL deployed and ready
- [ ] Kafka deployed and ready
- [ ] Keycloak deployed and ready
- [ ] MinIO deployed and ready

---

#### ✅ Step 10: Deploy Application Services
```bash
# Deploy all application services
kubectl apply -f infra/k8s/base/gateway-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/tenantadmin-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/customer-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/vehicle-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/workorder-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/inventory-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/payment-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/appointment-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/file-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/audit-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/notification-service.yaml -n autorepairshop-prod
kubectl apply -f infra/k8s/base/query-bff-service.yaml -n autorepairshop-prod

# Wait for all deployments to be ready
kubectl wait --for=condition=available deployment --all -n autorepairshop-prod --timeout=600s
```
- [ ] All 12 services deployed
- [ ] All deployments ready and available

---

### PHASE 4: Verification (15 minutes)

#### ✅ Step 11: Verify All Pods Running
```bash
kubectl get pods -n autorepairshop-prod
```
- [ ] All pods in "Running" state
- [ ] No pods in "CrashLoopBackOff" or "Error" state

---

#### ✅ Step 12: Check Service Health
```bash
# Test Gateway health
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n autorepairshop-prod -- \
  curl http://gateway-service:8080/actuator/health

# Check all service logs for errors
kubectl logs -l app=gateway-service -n autorepairshop-prod --tail=50
```
- [ ] Gateway health check returns "UP"
- [ ] No critical errors in logs

---

#### ✅ Step 13: Configure Ingress/Load Balancer
```bash
# Get external IP of Gateway service
kubectl get svc gateway-service -n autorepairshop-prod

# Configure your DNS to point to this IP
# Example: api.your-domain.com -> EXTERNAL-IP
```
- [ ] External IP obtained
- [ ] DNS configured to point to Gateway
- [ ] SSL certificate configured (if using HTTPS)

---

#### ✅ Step 14: Deploy Frontend
```bash
cd frontend
Update .env.production with production values
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.your-domain.com
VITE_KEYCLOAK_URL=https:
# //auth.your-domain.com
VITE_KEYCLOAK_REALM=autorepairshop
VITE_KEYCLOAK_CLIENT_ID=frontend
EOF

# Build for production
npm install
npm run build

# Deploy dist/ folder to your hosting (Netlify, Vercel, S3+CloudFront, etc.)
# Example for S3:
# aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```
- [ ] Frontend .env.production configured
- [ ] Frontend built successfully
- [ ] Frontend deployed to hosting
- [ ] Frontend accessible at production URL

---

### PHASE 5: Final Testing (10 minutes)

#### ✅ Step 15: Smoke Tests
- [ ] Open frontend URL in browser
- [ ] Login page loads correctly
- [ ] Can login with demo user (owner@demo.com / password123)
- [ ] Dashboard loads after login
- [ ] Can navigate to different pages
- [ ] API calls work (check browser network tab)

---

#### ✅ Step 16: Monitor for Issues
```bash
# Watch pods for any restarts
kubectl get pods -n autorepairshop-prod -w

# Check logs for errors
kubectl logs -f deployment/gateway-service -n autorepairshop-prod

# Check metrics (if Prometheus/Grafana deployed)
# Open Grafana and verify metrics are being collected
```
- [ ] No pod restarts in first 5 minutes
- [ ] No critical errors in logs
- [ ] Metrics being collected

---

## 🎉 DEPLOYMENT COMPLETE!

### Post-Deployment Actions

1. **Notify Team**
   - [ ] Announce deployment complete
   - [ ] Share production URLs
   - [ ] Share monitoring dashboard links

2. **Documentation**
   - [ ] Update deployment log with version deployed
   - [ ] Document any issues encountered
   - [ ] Update runbook if needed

3. **Monitoring Setup**
   - [ ] Set up alerts for critical metrics
   - [ ] Configure on-call rotation
   - [ ] Set up log aggregation

---

## 🚨 ROLLBACK (If Needed)

If something goes wrong:

```bash
# Rollback specific service
kubectl rollout undo deployment/SERVICE-NAME -n autorepairshop-prod

# Rollback all services
for service in gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff; do
  kubectl rollout undo deployment/${service}-service -n autorepairshop-prod
done

# Verify rollback
kubectl rollout status deployment --all -n autorepairshop-prod
```

---

## 📞 SUPPORT

**Emergency Contacts:**
- DevOps Lead: [Add contact]
- Backend Lead: [Add contact]
- Frontend Lead: [Add contact]

**Monitoring:**
- Grafana: [Add URL]
- Prometheus: [Add URL]
- Logs: [Add URL]

---

## ⏱️ ESTIMATED TIME: 1.5 - 2 HOURS

**Breakdown:**
- Configuration: 30 min
- Build & Push: 20 min
- Deployment: 30 min
- Verification: 15 min
- Testing: 10 min
- Buffer: 15 min

**TOTAL: ~2 hours**

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:
- ✅ All 12 services running in Kubernetes
- ✅ All health checks passing
- ✅ Frontend accessible and functional
- ✅ Users can login and use the application
- ✅ No critical errors in logs
- ✅ Metrics being collected

**YOU ARE READY TO DEPLOY! Follow this checklist step by step.**
