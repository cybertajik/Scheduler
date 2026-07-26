#!/bin/bash
set -e

echo "=== Staff Scheduler Rollback Script ==="

TARGET_COMMIT=${1:-HEAD~1}

echo "Rolling back code to $TARGET_COMMIT..."
git checkout $TARGET_COMMIT

echo "Rebuilding containers from previous commit..."
docker compose -f docker-compose.yml up -d --build

echo "Rollback completed. Current commit:"
git log -1 --oneline
