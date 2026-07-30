#!/bin/bash
# ==============================================================================
# Staff Scheduler — Application & Configuration Restoration Script
# ==============================================================================
set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/restore_app.sh <path-to-app-backup-tar-gz>"
    echo "Example: ./scripts/restore_app.sh ./backups/app_backup_20260726_220000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

# Verify archive integrity
./scripts/verify_backup.sh "$BACKUP_FILE"

echo "=== Restoring Application Code & Configuration from $BACKUP_FILE ==="
tar -xzf "$BACKUP_FILE" -C .

echo "Rebuilding and launching containers..."
docker compose build
docker compose up -d

echo "[SUCCESS] Application restore completed successfully!"
