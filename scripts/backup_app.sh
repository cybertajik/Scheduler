#!/bin/bash
# ==============================================================================
# Staff Scheduler — Application & Configuration Backup Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/app_backup_${TIMESTAMP}.tar.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "$BACKUP_DIR"

echo "=== Starting Application & Configuration Backup [${TIMESTAMP}] ==="

# Create compressed archive of project source code & configs while excluding heavy build artifacts
tar -czf "$BACKUP_FILE" \
    --exclude="./.git" \
    --exclude="./.venv" \
    --exclude="./node_modules" \
    --exclude="./frontend/node_modules" \
    --exclude="./frontend/dist" \
    --exclude="./backend/.venv" \
    --exclude="./__pycache__" \
    --exclude="./*.pyc" \
    --exclude="./backups" \
    .

sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"

echo "[SUCCESS] Application backup created: $BACKUP_FILE"
echo "[SUCCESS] SHA256 checksum saved: $CHECKSUM_FILE"
ls -lh "$BACKUP_FILE"
