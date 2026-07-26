# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.5.x   | :white_check_mark: |
| < 1.4   | :x:                |

## Reporting a Vulnerability

If you discover a potential security vulnerability within the Staff Scheduler platform, please do NOT open a public GitHub issue. Instead, send an email directly to security@scheduler.internal or contact the repository maintainer.

### Security Model Overview
* **Authentication**: OAuth2 Password Flow issuing short-lived HS256 JWT access tokens (30m) and long-lived refresh tokens (7d).
* **Password Hashing**: Passlib with Bcrypt algorithm.
* **Role-Based Access Control**:
  * `ADMIN`: Full access to system configuration, user accounts, and solver controls.
  * `SCHEDULER`: Schedule generation, manual edit, and rule configuration.
  * `EMPLOYEE`: Read-only access to published schedules and personal assignments.
* **Database Isolation**: Parameterized SQLAlchemy ORM queries preventing SQL injection.
