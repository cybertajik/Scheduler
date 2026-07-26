# 4. Google OR-Tools CP-SAT Solver Integration

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
Manual creation of monthly schedules for 50 workers across multiple shift types is prone to human error and rule violations.

## Decision
Integrate Google OR-Tools CP-SAT solver (`ORToolsSchedulerSolver`). Decision variables $x[w, s, d] \in \{0, 1\}$ represent worker $w$ assigned to shift $s$ on date $d$. Locked assignments are constrained to fixed values ($x[w, s, d] = 1$).

## Consequences
Generates mathematically proven optimal schedules in seconds while preserving manual scheduler locks.
