#!/bin/bash
# ==============================================================================
# Staff Scheduler — Master Backup Wrapper Script
# ==============================================================================
set -euo pipefail

echo "======================================================================"
echo " Starting Full Automated Backup & Integrity Verification Cycle "
echo "======================================================================"

./scripts/backup_db.sh
./scripts/backup_app.sh
./scripts/prune_backups.sh

echo "======================================================================"
echo "[SUCCESS] Full backup cycle completed successfully."
echo "======================================================================"
