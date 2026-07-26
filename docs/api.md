# REST API Specification

## Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/login`
* **Summary**: Authenticate user credentials and return JWT tokens.
* **Content-Type**: `application/x-www-form-urlencoded`
* **Parameters**: `username`, `password`
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_role": "ADMIN"
  }
  ```

---

## Worker Endpoints (`/api/v1/workers`)

### `GET /api/v1/workers`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**: Array of Worker objects.

### `POST /api/v1/workers`
* **Headers**: `Authorization: Bearer <token>` (Requires `ADMIN` or `SCHEDULER`)
* **Body**:
  ```json
  {
    "employee_number": "EMP-001",
    "first_name": "John",
    "last_name": "Doe",
    "weekly_contract_hours": 40.0
  }
  ```

---

## Background Jobs Endpoints (`/api/v1/jobs`)

### `POST /api/v1/jobs/generate`
* **Summary**: Enqueues OR-Tools schedule generation task.
* **Body**: `{ "schedule_id": "uuid", "max_solver_time_seconds": 30 }`
* **Response (200 OK)**: `{ "job_id": "string", "status": "PENDING", "progress": 5 }`

### `GET /api/v1/jobs/{job_id}/progress`
* **Response (200 OK)**: `{ "job_id": "string", "status": "SUCCESS", "progress_percentage": 100 }`
