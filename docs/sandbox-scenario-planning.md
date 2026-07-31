# Schedule Sandbox & Scenario Planning Architecture

This document describes the design, database schema, scenario simulation engines, comparison diff algorithms, and REST API specification for the **Schedule Sandbox & Scenario Planning** module.

---

## 1. Architectural Overview & Data Isolation

The Sandbox module allows administrators to experiment with schedule changes safely without modifying published production schedules.

> [!IMPORTANT]
> - **Data Isolation**: Sandboxes do **not** reference parent schedule assignments directly. Creating a sandbox duplicates parent shift instances and assignments into dedicated `sandbox_schedules`, `sandbox_shift_instances`, and `sandbox_assignments` tables.
> - **Zero Engine Alteration**: The core OR-Tools CP-SAT scheduling engine and DB models remain 100% untouched.
> - **Transactional Promotion**: Promoting a sandbox replaces live production assignments transactionally and logs audit records.

---

## 2. Database Schema

### `sandbox_schedules`
- `id`: UUID (Primary Key)
- `parent_schedule_id`: UUID (Foreign Key `schedules.id`, nullable)
- `name`: VARCHAR(150) (e.g. "Scenario A - Sick Call Simulation")
- `description`: TEXT
- `status`: VARCHAR(50) (`DRAFT`, `SIMULATED`, `APPROVED`, `REJECTED`, `PROMOTED`, `ARCHIVED`)
- `version`: INT (default 1)
- `author_id`: UUID (Foreign Key `users.id`)
- `year`: INT
- `month`: INT
- `scenario_type`: VARCHAR(50) (`SICK_CALL`, `VACATION_REQUEST`, `STAFF_SHORTAGE`, `EXTRA_STAFF`, `RULE_MODIFICATION`, `CUSTOM`)
- `scenario_params`: JSON (Simulation parameters)

### `sandbox_shift_instances`
- `id`: UUID (Primary Key)
- `sandbox_id`: UUID (Foreign Key `sandbox_schedules.id`, CASCADE)
- `date`: TIMESTAMP
- `shift_type_id`: UUID (Foreign Key `shift_types.id`)
- `required_workers`: INT

### `sandbox_assignments`
- `id`: UUID (Primary Key)
- `sandbox_shift_instance_id`: UUID (Foreign Key `sandbox_shift_instances.id`, CASCADE)
- `worker_id`: UUID (Foreign Key `workers.id`)
- `assignment_source`: VARCHAR(50)
- `locked`: BOOLEAN
- `notes`: TEXT

### `sandbox_versions`
- `id`: UUID (Primary Key)
- `sandbox_id`: UUID (Foreign Key `sandbox_schedules.id`, CASCADE)
- `version_number`: INT
- `change_description`: TEXT
- `author_id`: UUID (Foreign Key `users.id`)

---

## 3. Scenario Simulation Handlers

Administrators can simulate real-world operational scenarios:

| Scenario Type | Action Performed in Sandbox |
| --- | --- |
| `SICK_CALL` | Clears all shift assignments for specified employee on target dates. |
| `VACATION_REQUEST` | Clears shift assignments across requested vacation date range. |
| `STAFF_SHORTAGE` | Reduces required worker headcount demand across shift instances. |
| `EXTRA_STAFF` | Increases required worker headcount demand across shift instances. |
| `RULE_MODIFICATION` | Applies custom rule constraint overrides to sandbox. |

---

## 4. Visual Comparison & Metric Delta Engine

The comparison engine (`ScheduleComparisonEngine`) evaluates two schedules (Parent vs Sandbox) and generates:

1. **Assignment Diffs**:
   - `ADDED`: Shift assignment present in sandbox but not in original.
   - `REMOVED`: Shift assignment in original but cleared in sandbox.
   - `CHANGED_WORKER`: Shift reassigned from Worker A to Worker B.
2. **Metric Deltas**:
   - Coverage % Delta (`sandbox_coverage - original_coverage`)
   - Fairness Score Delta
   - Overtime Hours Delta
   - Unfilled Shift Count Delta

---

## 5. REST API Specification

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/sandboxes` | Create new sandbox schedule (cloning parent schedule). |
| `GET` | `/api/v1/sandboxes` | List all sandbox schedules. |
| `GET` | `/api/v1/sandboxes/{id}` | Get sandbox details and metrics. |
| `PATCH` | `/api/v1/sandboxes/{id}` | Update sandbox metadata (name, description, status). |
| `DELETE` | `/api/v1/sandboxes/{id}` | Permanently delete sandbox. |
| `POST` | `/api/v1/sandboxes/{id}/clone` | Duplicate existing sandbox. |
| `POST` | `/api/v1/sandboxes/{id}/archive` | Archive sandbox schedule. |
| `POST` | `/api/v1/sandboxes/{id}/restore` | Restore archived sandbox to draft status. |
| `POST` | `/api/v1/sandboxes/{id}/simulate` | Run scenario simulation. |
| `GET` | `/api/v1/sandboxes/{id}/compare/{target_id}` | Compare parent schedule vs sandbox diff. |
| `POST` | `/api/v1/sandboxes/{id}/promote` | Promote sandbox assignments to live production schedule. |
| `GET` | `/api/v1/sandboxes/{id}/versions` | Get version history log for sandbox. |
