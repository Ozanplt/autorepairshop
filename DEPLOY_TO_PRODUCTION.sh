#!/bin/bash
# Production Deployment Script for AutoRepairShop Management System
# Usage: ./DEPLOY_TO_PRODUCTION.sh [environment]
# Example: ./DEPLOY_TO_PRODUCTION.sh prod

set -e

ENVIRONMENT=${1:-prod}
NAMESPACE="autorepairshop-${ENVIRONMENT}"

echo "=========================================="
echo "AutoRepairShop Production Deployment"
echo "Environment: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "=========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}docker not found. Please install docker.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites OK${NC}"

# Confirm deployment
echo -e "${YELLOW}WARNING: You are about to deploy to ${ENVIRONMENT} environment${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Step 1: Build all services
echo -e "${YELLOW}Step 1: Building all services...${NC}"
./mvnw clean install -DskipTests
echo -e "${GREEN}Build complete${NC}"

# Step 2: Build Docker images
echo -e "${YELLOW}Step 2: Building Docker images...${NC}"
SERVICES=(gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff)
VERSION=$(git rev-parse --short HEAD)

for service in "${SERVICES[@]}"; do
    echo "Building ${service}-service:${VERSION}..."
    cd services/${service}-service
    docker build -t autorepairshop/${service}-service:${VERSION} .
    docker tag autorepairshop/${service}-service:${VERSION} autorepairshop/${service}-service:latest
    cd ../..
done
echo -e "${GREEN}Docker images built${NC}"

# Step 3: Push Docker images (uncomment when registry is configured)
# echo -e "${YELLOW}Step 3: Pushing Docker images to registry...${NC}"
# for service in "${SERVICES[@]}"; do
#     docker push autorepairshop/${service}-service:${VERSION}
#     docker push autorepairshop/${service}-service:latest
# done
# echo -e "${GREEN}Docker images pushed${NC}"

# Step 4: Create namespace if not exists
echo -e "${YELLOW}Step 4: Creating namespace...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}Namespace ready${NC}"

# Step 5: Create secrets (check if they exist first)
echo -e "${YELLOW}Step 5: Checking secrets...${NC}"
if ! kubectl get secret db-credentials -n ${NAMESPACE} &> /dev/null; then
    echo -e "${RED}ERROR: Secret 'db-credentials' not found in namespace ${NAMESPACE}${NC}"
    echo "Please create secrets first using:"
    echo "kubectl create secret generic db-credentials --from-env-file=prod.env -n ${NAMESPACE}"
    exit 1
fi
echo -e "${GREEN}Secrets OK${NC}"

# Step 6: Deploy infrastructure
echo -e "${YELLOW}Step 6: Deploying infrastructure...${NC}"
kubectl apply -f infra/k8s/base/namespace.yaml
kubectl apply -f infra/k8s/base/postgres.yaml -n ${NAMESPACE}
kubectl apply -f infra/k8s/base/kafka.yaml -n ${NAMESPACE}
kubectl apply -f infra/k8s/base/keycloak.yaml -n ${NAMESPACE}
kubectl apply -f infra/k8s/base/minio.yaml -n ${NAMESPACE}

echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}Infrastructure deployed${NC}"

# Step 7: Deploy services
echo -e "${YELLOW}Step 7: Deploying services...${NC}"
kubectl apply -k infra/k8s/overlays/${ENVIRONMENT}

# Wait for deployments
echo "Waiting for services to be ready..."
for service in "${SERVICES[@]}"; do
    echo "Waiting for ${service}-service..."
    kubectl rollout status deployment/${service}-service -n ${NAMESPACE} --timeout=300s
done
echo -e "${GREEN}Services deployed${NC}"

# Step 8: Verify deployment
echo -e "${YELLOW}Step 8: Verifying deployment...${NC}"
echo "Pods:"
kubectl get pods -n ${NAMESPACE}
echo ""
echo "Services:"
kubectl get svc -n ${NAMESPACE}
echo ""
echo "Ingress:"
kubectl get ingress -n ${NAMESPACE}

# Step 9: Run smoke tests
echo -e "${YELLOW}Step 9: Running smoke tests...${NC}"
GATEWAY_URL=$(kubectl get svc gateway-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$GATEWAY_URL" ]; then
    GATEWAY_URL=$(kubectl get svc gateway-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
fi

echo "Testing Gateway health endpoint..."
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n ${NAMESPACE} -- \
    curl -f http://gateway-service:8080/actuator/health || echo "Health check failed"

echo -e "${GREEN}Smoke tests complete${NC}"

# Step 10: Summary
echo ""
echo "=========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETE${NC}"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "Version: ${VERSION}"
echo ""
echo "Next steps:"
echo "1. Verify all services are healthy"
echo "2. Check logs: kubectl logs -f deployment/gateway-service -n ${NAMESPACE}"
echo "3. Monitor metrics in Grafana"
echo "4. Test critical user flows"
echo ""
echo "To rollback:"
echo "kubectl rollout undo deployment/SERVICE_NAME -n ${NAMESPACE}"
echo "=========================================="
