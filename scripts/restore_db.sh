#!/bin/bash
# ==============================================================================
# Staff Scheduler — Database Restoration Script
# ==============================================================================
set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/restore_db.sh <path-to-sql-gz-backup-file>"
    echo "Example: ./scripts/restore_db.sh ./backups/db_backup_20260726_220000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

# Step 1: Verify Backup Integrity
./scripts/verify_backup.sh "$BACKUP_FILE"

echo "=== Restoring PostgreSQL Database from $BACKUP_FILE ==="
echo "WARNING: This will overwrite current database contents!"

DB_USER=$(docker exec scheduler_postgres printenv POSTGRES_USER 2>/dev/null || echo "postgres")
DB_NAME=$(docker exec scheduler_postgres printenv POSTGRES_DB 2>/dev/null || echo "scheduler")

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-scheduler}"

# Re-create database and restore compressed SQL stream
docker exec -i scheduler_postgres dropdb -U "$DB_USER" "$DB_NAME" || true
docker exec -i scheduler_postgres createdb -U "$DB_USER" "$DB_NAME"
gunzip -c "$BACKUP_FILE" | docker exec -i scheduler_postgres psql -U "$DB_USER" -d "$DB_NAME"

echo "[SUCCESS] PostgreSQL database restoration completed successfully!"
