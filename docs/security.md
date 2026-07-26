# Security & RBAC Policies

## Security Features

1. **Password Hashing**: Passlib implementation using `bcrypt` algorithm.
2. **JWT Security**: Signed via HMAC-SHA256 (`HS256`). Access tokens expire in 30 minutes.
3. **Token Revocation**: Blacklisting token JTI upon logout via `TokenBlacklistService`.
4. **Parameterized SQL Queries**: Managed through SQLAlchemy ORM, preventing SQL Injection.
5. **CORS Headers**: Configured in FastAPI middleware restricting origin domain access.

---

## Role Matrix

| Endpoint Group | Method | Admin | Scheduler | Employee |
| :--- | :--- | :---: | :---: | :---: |
| `/api/v1/users` | ALL | ✅ | ❌ | ❌ |
| `/api/v1/workers` | GET | ✅ | ✅ | ✅ |
| `/api/v1/workers` | POST/PATCH | ✅ | ✅ | ❌ |
| `/api/v1/jobs` | POST | ✅ | ✅ | ❌ |
| `/api/v1/schedules` | GET | ✅ | ✅ | ✅ |
