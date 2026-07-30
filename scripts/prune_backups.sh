#!/bin/bash
# ==============================================================================
# Staff Scheduler — Backup Retention & Pruning Policy Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "=== Pruning Backups Older Than ${RETENTION_DAYS} Days in ${BACKUP_DIR} ==="

find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" -o -name "*.sha256" \) -mtime "+${RETENTION_DAYS}" -print -delete

echo "[SUCCESS] Pruning complete. Remaining backups:"
ls -lh "$BACKUP_DIR"
