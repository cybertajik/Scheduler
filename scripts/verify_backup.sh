#!/bin/bash
# ==============================================================================
# Staff Scheduler — Backup Verification & Integrity Check Script
# ==============================================================================
set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: ./scripts/verify_backup.sh <path-to-backup-archive>"
    echo "Example: ./scripts/verify_backup.sh ./backups/db_backup_20260726_220000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

echo "=== Verifying Backup Integrity for $BACKUP_FILE ==="

# 1. SHA256 Checksum Validation
if [ -f "$CHECKSUM_FILE" ]; then
    echo "Checking SHA256 checksum match..."
    sha256sum -c "$CHECKSUM_FILE"
    echo "[PASSED] SHA256 Checksum Validated."
else
    echo "[WARNING] No .sha256 file found for $BACKUP_FILE. Skipping checksum verification."
fi

# 2. Archive Gzip Integrity
echo "Testing Gzip compression integrity..."
gzip -t "$BACKUP_FILE"
echo "[PASSED] Gzip archive structure valid."

# 3. File Size Validation
MIN_SIZE=100
FILE_SIZE=$(wc -c < "$BACKUP_FILE")
if [ "$FILE_SIZE" -lt "$MIN_SIZE" ]; then
    echo "[ERROR] Backup file size ($FILE_SIZE bytes) is suspiciously small."
    exit 1
fi

echo "[SUCCESS] Backup verification complete! File $BACKUP_FILE is healthy and intact."
