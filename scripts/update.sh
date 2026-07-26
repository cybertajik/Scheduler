#!/bin/bash
set -e

echo "=== Staff Scheduler Zero-Downtime Update ==="

echo "Pulling latest code from Git..."
git pull origin main

echo "Rebuilding and updating containers..."
docker compose -f docker-compose.yml up -d --build

echo "Running database migrations..."
docker compose exec -T backend alembic upgrade head

echo "Pruning dangling docker images..."
docker image prune -f

echo "Update completed successfully!"
docker compose ps
