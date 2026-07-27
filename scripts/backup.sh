#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/scheduler_backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "=== Creating PostgreSQL Database Backup ==="
docker compose exec -T postgres pg_dump -U postgres scheduler > "$BACKUP_FILE"

echo "Backup created successfully: $BACKUP_FILE"

echo "Pruning backups older than 30 days..."
find "$BACKUP_DIR" -type f -name "scheduler_backup_*.sql" -mtime +30 -delete || true

ls -lh "$BACKUP_FILE"
