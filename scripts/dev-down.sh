#!/bin/bash
echo "Stopping AutoRepairShop Management System..."
docker-compose -f infra/docker-compose.yml down
pkill -f "java -jar services"
echo "System stopped."
