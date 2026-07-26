# Authentication & Authorization

## Overview
The application enforces stateless OAuth2 Bearer token authentication using JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).

## Access & Refresh Token Lifetime
* **Access Tokens**: Expire in **30 minutes**.
* **Refresh Tokens**: Expire in **7 days**.

## Role-Based Access Control (RBAC)

```mermaid
graph TD
    UserRole[User Role] --> Admin[ADMIN]
    UserRole --> Scheduler[SCHEDULER]
    UserRole --> Employee[EMPLOYEE]

    Admin -->|Full Access| UserMgmt[User Account Management]
    Admin -->|Full Access| MasterData[Workers, Shifts, & Rules CRUD]
    Admin -->|Full Access| ScheduleSolver[Schedule Solver & Generation]
    
    Scheduler -->|Read/Write| MasterData
    Scheduler -->|Read/Write| ScheduleSolver
    
    Employee -->|Read-Only| PublishedSchedules[View Published Schedules]
```
