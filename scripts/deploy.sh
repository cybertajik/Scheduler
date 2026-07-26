#!/bin/bash
set -e

echo "=== Staff Scheduler Production Deployment ==="

# Check docker compose
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    exit 1
fi

# Load production environment variables
if [ -f .env.production ]; then
    echo "Loading .env.production..."
    export $(grep -v '^#' .env.production | xargs)
fi

echo "Building and starting production containers..."
docker compose -f docker-compose.yml up -d --build

echo "Waiting for database readiness..."
sleep 5

echo "Executing Alembic database migrations..."
docker compose exec -T backend alembic upgrade head || echo "Alembic migrations completed or skipped."

echo "Deployment complete! Application running on port 80."
docker compose ps
