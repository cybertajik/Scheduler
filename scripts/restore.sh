#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <path-to-sql-backup-file>"
    echo "Example: ./scripts/restore.sh ./backups/scheduler_backup_20260726_220000.sql"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

echo "=== Restoring PostgreSQL Database from $BACKUP_FILE ==="
docker compose exec -T postgres dropdb -U postgres scheduler || true
docker compose exec -T postgres createdb -U postgres scheduler
cat "$BACKUP_FILE" | docker compose exec -T postgres psql -U postgres -d scheduler

echo "Database restoration completed successfully!"
