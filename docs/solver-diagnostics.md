# Solver Explainability & Decision Diagnostics Architecture

This document describes the design, telemetry data structure, severity ranking model, and API endpoints for the **Solver Explainability & Decision Diagnostics** layer added to the Staff Scheduler.

---

## 1. Overview & Non-Intrusive Design

The diagnostic engine is designed as a **read-only telemetry and evaluation layer** surrounding the Google OR-Tools CP-SAT constraint solver.

> [!IMPORTANT]
> The core scheduling algorithm, CP-SAT decision variable definitions (`shifts_vars[(worker_id, date, shift_type_id)]`), hard constraint builders, and soft optimization scoring function remain **100% unchanged**.

### Key Capabilities
1. **Successful Schedule Telemetry**: Evaluates fulfillment coverage %, workload equity index (fairness score 0-100), overtime total hours & affected employees, weekend & night shift distribution, and skill coverage metrics.
2. **Ranked Infeasibility Explanations**: Categorizes and ranks root causes for infeasible or degraded solver runs into 4 severity tiers (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) across 9 domain categories.
3. **Constraint Breakdown**: Inspects evaluated hard and soft constraints, affected employees, affected dates, and suggested corrective actions.
4. **Suggested Fixes**: Generates actionable recommendations sorted by impact score (e.g. adding employees, relaxing headcount, adjusting vacation windows, authorizing overtime).
5. **Solver Telemetry**: Exposes variables created, constraints built, wall time (s), memory estimate (MB), objective score, branches explored, and conflicts detected.
6. **Structured Logging**: Emits `[SOLVER_RUN]` log entries containing timestamp, runtime, objective score, status, and summary.

---

## 2. Infeasibility Severity Ranking Model

When a schedule run cannot satisfy all hard constraints or exhibits shortages, the diagnostic engine ranks root causes by severity:

| Severity | Category | Example Root Cause | Suggested Action |
| --- | --- | --- | --- |
| **CRITICAL** | `INSUFFICIENT_QUALIFIED_WORKERS` | Roster contains zero active employees. | Add active employees to department roster. |
| **CRITICAL** | `TOO_MANY_UNAVAILABLE` | Daily headcount demand exceeds total staff headcount. | Reduce shift headcount demand or hire additional employees. |
| **HIGH** | `VACATION_CONFLICT` | Overlapping employee vacations cause staffing shortage. | Adjust employee vacation start/end dates. |
| **HIGH** | `MANDATORY_REST_CONFLICT` | Minimum rest period window (11 hours) violated across consecutive days. | Adjust shift start/end times or reassign consecutive shifts. |
| **HIGH** | `NIGHT_RECOVERY_CONFLICT` | Insufficient staff eligible for night shifts due to `NO_NIGHTS` restriction. | Remove `NO_NIGHTS` restriction for eligible employees. |
| **MEDIUM** | `MAX_HOURS_EXCEEDED` | Employee weekly contract hours cap exceeded. | Increase weekly contract hours baseline or authorize overtime. |
| **MEDIUM** | `WEEKEND_RESTRICTION_CONFLICT` | `NO_WEEKENDS` constraints prevent weekend shift coverage. | Relax weekend restriction for key employees. |
| **LOW** | `MUTUALLY_CONFLICTING_RULES` | Soft constraint trade-offs reduce overall fairness score. | Rebalance soft constraint penalty weights in solver configuration. |

---

## 3. REST API Specification

### 1. Get Schedule Solver Diagnostics
* **Endpoint**: `GET /api/v1/schedules/{schedule_id}/diagnostics`
* **Response**: `ComprehensiveDiagnosticsDTO`

```json
{
  "schedule_id": "c7a8f9e0-1234-5678-9abc-def012345678",
  "status": "OPTIMAL",
  "timestamp": "2026-07-31T08:15:00Z",
  "solver_statistics": {
    "variables_created": 1440,
    "constraints_created": 320,
    "solver_runtime_seconds": 0.42,
    "memory_estimate_mb": 22.9,
    "objective_score": 120.0,
    "branches_explored": 142,
    "conflicts_detected": 12,
    "solver_status": "OPTIMAL"
  },
  "successful_diagnostics": {
    "coverage_percentage": 100.0,
    "fairness_score": 94.5,
    "total_assigned_shifts": 45,
    "unassigned_shifts": 0,
    "soft_constraint_violations": [],
    "overtime_summary": {
      "total_overtime_hours": 8.0,
      "employees_with_overtime_count": 1,
      "max_overtime_hours_employee": 8.0,
      "affected_employee_names": ["Alice Smith"]
    },
    "weekend_distribution": [
      { "employee_id": "w1", "employee_name": "Alice Smith", "count": 2, "target": 2.0 },
      { "employee_id": "w2", "employee_name": "Bob Jones", "count": 2, "target": 2.0 }
    ],
    "night_shift_distribution": [
      { "employee_id": "w1", "employee_name": "Alice Smith", "count": 1, "target": 1.0 }
    ],
    "skill_coverage_summary": [
      { "skill_tag": "Morning Shift", "required_shifts": 15, "assigned_shifts": 15, "unmet_shifts": 0, "coverage_percentage": 100.0 }
    ]
  },
  "failed_diagnostics": null,
  "constraint_diagnostics": [
    {
      "constraint_name": "Vacation & Approved Leave",
      "constraint_type": "HARD",
      "category": "VACATION_CONFLICT",
      "employees_affected": ["Charlie Brown"],
      "dates_affected": ["2026-08-10"],
      "number_of_conflicts": 1,
      "suggested_corrective_actions": ["Adjust vacation dates or hire temporary coverage."]
    }
  ],
  "suggested_fixes": [
    {
      "id": "FIX-ALLOW-OVERTIME",
      "title": "Allow Overtime Workload",
      "description": "Enable soft overtime allowance (+5 hours/week) for experienced employees.",
      "action_type": "ALLOW_OVERTIME",
      "impact_score": 7.0
    }
  ]
}
```

### 2. Export Solver Diagnostics
* **Endpoint**: `GET /api/v1/schedules/{schedule_id}/diagnostics/export`
* **Response**: Formatted JSON file attachment (`solver_diagnostics_{schedule_id}.json`).

---

## 4. Frontend Integration

In the Interactive Schedule Editor (`ScheduleDetailPage`), click the **Diagnostics** button in the header toolbar to expand the glassmorphism panel.

The panel features 4 tabs:
1. **Overview & Performance**: Top KPI cards, infeasibility root cause alerts, and SVG weekend/night distribution progress bars.
2. **Constraint Breakdown**: Filterable table of evaluated hard/soft constraints with conflict counts and corrective actions.
3. **Suggested Fixes**: Impact-ranked recommendations.
4. **Solver Statistics**: CP-SAT engine telemetry (variables, constraints, runtime, memory estimate, branches, conflicts).
