# Disaster Recovery & Backup Guide — Staff Scheduler

## 1. Overview & Recovery Objectives
This document defines the disaster recovery (DR) strategy, automated backup procedures, and step-by-step restoration protocols for **Staff Scheduler**.

- **Recovery Point Objective (RPO)**: < 24 hours (Nightly automated SQL dumps).
- **Recovery Time Objective (RTO)**: < 30 minutes (Docker Compose automated restore).

---

## 2. Backup Architecture & File Structure

```text
/home/ad/app/
├── backups/
│   ├── db_backup_20260726_020000.sql.gz      # Compressed PostgreSQL Dump
│   ├── db_backup_20260726_020000.sql.gz.sha256 # SHA256 Verification Checksum
│   ├── app_backup_20260726_030000.tar.gz     # Code & Config Archive
│   └── app_backup_20260726_030000.tar.gz.sha256
└── scripts/
    ├── backup_db.sh     # Nightly DB backup script
    ├── backup_app.sh    # Weekly application code backup script
    ├── backup_all.sh    # Master backup wrapper
    ├── restore_db.sh   # DB restoration tool with SHA256 validation
    ├── restore_app.sh  # Full stack application recovery tool
    ├── verify_backup.sh# Integrity & gzip verification test
    └── prune_backups.sh# Retention cleaner (default 30 days)
```

---

## 3. Disaster Recovery Scenarios & Procedures

### Scenario A: Accidental Data Deletion or DB Corruption
1. Identify the latest valid database dump in `./backups/`.
2. Verify backup integrity:
   ```bash
   ./scripts/verify_backup.sh ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
   ```
3. Execute database restoration:
   ```bash
   ./scripts/restore_db.sh ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
   ```
4. Verify backend health:
   ```bash
   curl http://localhost/api/v1/health/database
   ```

---

### Scenario B: Complete Server Host Failure or Volume Loss
1. Provision new Ubuntu Server host (4 Cores, 24GB RAM, Docker Compose installed).
2. Transfer backup archives (`app_backup_*.tar.gz` and `db_backup_*.sql.gz`) to target directory `/home/ad/app`.
3. Restore application configuration & source files:
   ```bash
   ./scripts/restore_app.sh ./backups/app_backup_YYYYMMDD_HHMMSS.tar.gz
   ```
4. Restore database dump:
   ```bash
   ./scripts/restore_db.sh ./backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
   ```
5. Run Pytest suite to confirm operational status:
   ```bash
   docker exec scheduler_backend pytest /app/tests/
   ```

---

## 4. Disaster Recovery Checklist

- [x] Host server has Docker & Docker Compose installed.
- [x] Database backups scheduled nightly at 02:00 AM via Crontab.
- [x] Application configs archived weekly on Sundays at 03:00 AM.
- [x] SHA256 checksum generated for every backup archive.
- [x] Backup retention policy configured to 30 days.
- [x] Tested `./scripts/restore_db.sh` against clean PostgreSQL environment.
- [x] Verified system status dashboard reports healthy PostgreSQL and Redis connections.
