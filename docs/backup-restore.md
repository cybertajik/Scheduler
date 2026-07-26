# Backup & Disaster Recovery Procedures

## Database Backup (PostgreSQL)

Execute `pg_dump` inside the running `scheduler_postgres` database container:

```bash
# Generate SQL dump file
docker-compose exec -T postgres pg_dump -U postgres scheduler > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Database Restoration

Restore database state from a backup file:

```bash
# Drop existing DB and restore from SQL dump
docker-compose exec -T postgres dropdb -U postgres scheduler
docker-compose exec -T postgres createdb -U postgres scheduler
cat backup_file.sql | docker-compose exec -T postgres psql -U postgres -d scheduler
```
