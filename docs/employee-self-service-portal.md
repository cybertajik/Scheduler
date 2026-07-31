# Employee Self-Service Portal Specification

This document describes the design, RBAC permission barrier rules, vacation/swap workflow, availability preferences, and REST API specification for the **Employee Self-Service Portal**.

---

## 1. Architectural Overview & RBAC Security Barrier

The Employee Self-Service Portal allows non-administrative workforce employees to view personalized schedule rosters, request shift trades/swaps, submit vacation leave, manage availability preferences, and download schedule reports.

> [!IMPORTANT]
> - **Strict Role Isolation**: Employees logged in under `UserRole.EMPLOYEE` can **only** access personalized endpoints bound to their authenticated `user_id` / `worker_id`.
> - **Forbidden Administrative Routes**: Direct access to administrative endpoints (`/users`, `/organizations`, `/audit-log`, `/import-export`, `/rules`, `/sandboxes`) returns HTTP `403 Forbidden`.
> - **Zero Core Solver Alteration**: Core scheduling engine behavior and OR-Tools CP-SAT logic remain 100% untouched.

---

## 2. Shift Swap & Vacation Workflows

### Shift Swaps
1. Employee A selects an assigned shift and proposes a swap to Employee B.
2. The engine performs automated validation:
   - Verifies Employee B holds required skills for the shift.
   - Verifies rest period and maximum weekly hours limits.
3. Employee B accepts or declines the proposed swap offer.
4. An administrator approves or rejects the peer-accepted swap.

### Vacation Leave
1. Employee submits vacation start date, end date, and reason.
2. System computes requested days and checks remaining vacation balance allowance.
3. Request enters `PENDING` state until approved by administrator.

---

## 3. Database Schema

### `vacation_requests`
- `id`: UUID (Primary Key)
- `worker_id`: UUID (Foreign Key `workers.id`, CASCADE)
- `start_date`: DATE
- `end_date`: DATE
- `reason`: TEXT
- `status`: VARCHAR(50) (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `admin_notes`: TEXT
- `approved_by_id`: UUID (Foreign Key `users.id`)

### `shift_swap_requests`
- `id`: UUID (Primary Key)
- `requestor_worker_id`: UUID (Foreign Key `workers.id`)
- `target_worker_id`: UUID (Foreign Key `workers.id`)
- `requestor_assignment_id`: UUID (Foreign Key `assignments.id`)
- `target_assignment_id`: UUID (Foreign Key `assignments.id`, nullable)
- `status`: VARCHAR(50) (`PROPOSED`, `ACCEPTED`, `DECLINED`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `notes`: TEXT

### `availability_submissions`
- `id`: UUID (Primary Key)
- `worker_id`: UUID (Foreign Key `workers.id`)
- `date`: DATE
- `availability_type`: VARCHAR(50) (`UNAVAILABLE`, `PREFERRED_OFF`, `PREFERRED_SHIFT`)
- `shift_type_id`: UUID (Foreign Key `shift_types.id`, nullable)

### `user_notifications`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key `users.id`)
- `title`: VARCHAR(150)
- `message`: TEXT
- `category`: VARCHAR(50) (`SCHEDULE`, `VACATION`, `SWAP`, `ANNOUNCEMENT`)
- `is_read`: BOOLEAN

---

## 4. REST API Specification

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/employee-portal/dashboard` | Get personalized dashboard metrics & upcoming shifts. |
| `GET` | `/api/v1/employee-portal/my-schedule` | Get authenticated employee's shift roster. |
| `POST` | `/api/v1/employee-portal/vacations` | Submit new vacation leave request. |
| `GET` | `/api/v1/employee-portal/vacations` | List employee's vacation requests and status. |
| `POST` | `/api/v1/employee-portal/swaps` | Propose shift swap to a colleague. |
| `GET` | `/api/v1/employee-portal/swaps` | List incoming and outgoing shift swap requests. |
| `POST` | `/api/v1/employee-portal/availability` | Submit date availability or shift preferences. |
| `GET` | `/api/v1/employee-portal/availability` | List availability submissions. |
| `PATCH` | `/api/v1/employee-portal/profile` | Update phone, email, or password. |
| `GET` | `/api/v1/employee-portal/download-document` | Download personal schedule CSV report. |
