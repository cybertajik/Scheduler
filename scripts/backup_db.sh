#!/bin/bash
# ==============================================================================
# Staff Scheduler — Database Backup Script (PostgreSQL)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "$BACKUP_DIR"

echo "=== Starting PostgreSQL Database Backup [${TIMESTAMP}] ==="

DB_USER=$(docker exec scheduler_postgres printenv POSTGRES_USER 2>/dev/null || echo "postgres")
DB_NAME=$(docker exec scheduler_postgres printenv POSTGRES_DB 2>/dev/null || echo "scheduler")

# Fallback if empty
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-scheduler}"

echo "Backing up database '$DB_NAME' as user '$DB_USER'..."

# Execute pg_dump from postgres container and compress using gzip
docker exec -i scheduler_postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip -9 > "$BACKUP_FILE"

# Calculate SHA256 checksum for integrity verification
sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"

echo "[SUCCESS] Database backup created: $BACKUP_FILE"
echo "[SUCCESS] SHA256 checksum saved: $CHECKSUM_FILE"

# Print backup size
ls -lh "$BACKUP_FILE"
