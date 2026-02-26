#!/bin/bash
set -e

echo "Starting AutoRepairShop Management System..."

cd "$(dirname "$0")/.."

echo "Starting infrastructure with docker-compose..."
docker-compose -f infra/docker-compose.yml up -d

echo "Waiting for services to be ready..."
./scripts/wait-for.sh localhost 5432 60
./scripts/wait-for.sh localhost 9092 60
./scripts/wait-for.sh localhost 9080 60

echo "Building services..."
./mvnw clean install -DskipTests

echo "Starting services..."
for service in gateway tenantadmin customer vehicle workorder inventory payment appointment file audit notification query-bff; do
    echo "Starting ${service}-service..."
    java -jar services/${service}-service/target/${service}-service-1.0.0-SNAPSHOT.jar &
done

echo ""
echo "=========================================="
echo "AutoRepairShop System Started!"
echo "=========================================="
echo "Frontend:        http://localhost:5173"
echo "API Gateway:     http://localhost:8080"
echo "Keycloak:        http://localhost:9080 (admin/admin)"
echo "Grafana:         http://localhost:3000 (admin/admin)"
echo ""
echo "Default Credentials:"
echo "  Owner:    owner@demo.com / password123"
echo "  Admin:    admin@demo.com / password123"
echo "  Mechanic: mechanic@demo.com / password123"
echo "=========================================="
