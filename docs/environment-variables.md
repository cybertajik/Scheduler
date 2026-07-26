# Environment Variables Reference

| Variable Name | Description | Default Value | Example Production Value |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | Name of application | `Staff Scheduler` | `Staff Scheduler` |
| `SECRET_KEY` | HMAC JWT signing key | `default_secret` | `b9f084cf320e71cb...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `30` | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifespan | `7` | `7` |
| `POSTGRES_SERVER` | Database host | `postgres` | `postgres` |
| `POSTGRES_USER` | Database username | `postgres` | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` | `SecureDbPassword123!` |
| `POSTGRES_DB` | Database name | `scheduler` | `scheduler` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery message queue URL | `redis://redis:6379/0` | `redis://redis:6379/0` |
| `CELERY_RESULT_BACKEND` | Celery result store URL | `redis://redis:6379/0` | `redis://redis:6379/0` |
