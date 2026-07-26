# 3. Modular Rules Engine Architecture

* **Status**: Accepted
* **Date**: 2026-07-26

## Context
The system must evaluate diverse scheduling rules (vacations, rest periods after night shifts, weekend limits, consecutive work days) both during manual calendar edits and during automated solver optimization.

## Decision
Build a decoupled rules evaluation engine under `backend/app/rules/` implementing an `AbstractRuleEvaluator` interface. Evaluators return structured `RuleEvaluationResult` objects containing compliance booleans, penalty scores, and human-readable diagnostic messages.

## Consequences
Separates rule evaluation logic from HTTP handlers and solver models, enabling reusability across manual schedule editing and solver diagnostics.
