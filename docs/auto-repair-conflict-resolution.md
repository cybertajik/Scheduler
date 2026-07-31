# Intelligent Auto-Repair & Conflict Resolution Specification

This document describes the design, 6-tiered repair search strategy, disruption scoring formula, undo/redo state management, and REST API specification for the **Intelligent Auto-Repair & Conflict Resolution** module.

---

## 1. Architectural Overview & Minimal Change Principle

The Auto-Repair Engine operates as an optimization layer above existing schedules to detect operational conflicts (vacation, unavailability, max hours, rest periods, night recovery, skill mismatch, double booking) and generate targeted corrective actions.

> [!IMPORTANT]
> - **Zero Core Solver Alteration**: The primary OR-Tools CP-SAT scheduling engine logic remains **100% untouched**.
> - **Minimal Change Strategy**: Auto-repair avoids full schedule regeneration. It prioritizes 1-to-1 employee swaps and targeted reassignments to preserve maximum existing assignments.
> - **Transactional Undo/Redo**: Applying a repair captures `snapshot_before` and `snapshot_after` in `schedule_repairs` table, enabling one-click undo and redo operations.

---

## 2. 6-Tiered Repair Search Strategy

Repairs are searched in strict hierarchical order to minimize disruption:

| Tier | Search Strategy | Disruption Weight |
| --- | --- | --- |
| **Tier 1: Single Employee Swap** | Swaps assignment with an eligible colleague on the same date/shift. | 1.0 (Lowest) |
| **Tier 2: Shift Reassignment** | Reassigns conflict shift to another available qualified employee. | 1.2 |
| **Tier 3: Qualified Replacement** | Assigns unallocated qualified employee with lowest current workload. | 1.5 |
| **Tier 4: Overtime Assignment** | Assigns candidate with overtime allowance if no normal-hour worker exists. | 2.0 |
| **Tier 5: Soft Rule Relaxation** | Relaxes non-mandatory soft constraints (e.g. preferred off-days). | 2.5 |
| **Tier 6: Local Window CP-SAT Mini-Solve** | Targeted local mini-solve for specific day/department window. | 3.0 |

---

## 3. Multi-Plan Ranking & Disruption Score Formula

The engine generates up to **5 alternative repair plans** ranked by **Disruption Score**:

$$\text{DisruptionScore} = (\text{ChangedAssignments} \times 10) + (\text{OvertimeHoursDelta} \times 5) - (\text{ConflictsResolved} \times 20) + (100 - \text{FairnessScore})$$

- **Plan 1**: Minimal Disruption 1-to-1 Employee Swap [Recommended]
- **Plan 2**: Highest Workforce Fairness Strategy
- **Plan 3**: Zero Overtime Constraint Strategy
- **Plan 4**: Maximum Coverage Fulfill Strategy
- **Plan 5**: Soft Rule Relaxation Strategy

---

## 4. REST API Specification

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/v1/schedules/{id}/repair/analyze` | Analyze schedule conflicts and return conflict items. |
| `POST` | `/api/v1/schedules/{id}/repair/plans` | Generate up to 5 alternative ranked repair plans. |
| `POST` | `/api/v1/schedules/{id}/repair/apply` | Apply selected repair plan to schedule. |
| `POST` | `/api/v1/schedules/{id}/repair/undo` | Undo last applied repair plan (reverts to `snapshot_before`). |
| `POST` | `/api/v1/schedules/{id}/repair/redo` | Redo previously undone repair plan (re-applies `snapshot_after`). |
| `GET` | `/api/v1/schedules/{id}/repair/history` | Get repair audit trail for schedule. |
