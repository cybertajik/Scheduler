from datetime import date, timedelta
from typing import Dict, Tuple, List
from ortools.sat.python import cp_model
from app.solver.dtos import (
    SolverInputDTO,
    SolverResultDTO,
    SolverAssignmentDTO,
    UnfilledShiftDTO,
    InfeasibilityDiagnosticDTO
)
from app.solver.diagnostics.infeasibility_explainer import InfeasibilityExplainer

class ResultTranslator:
    """
    Translates Google OR-Tools CP-SAT solver output into structured, JSON-friendly SolverResultDTO.
    """

    @staticmethod
    def translate(
        solver: cp_model.CpSolver,
        status_code: int,
        input_data: SolverInputDTO,
        shifts_vars: Dict[Tuple[str, str, str], cp_model.IntVar],
        unfilled_vars: Dict[Tuple[str, str], cp_model.IntVar],
        runtime_seconds: float
    ) -> SolverResultDTO:
        status_name = solver.StatusName(status_code)
        is_solved = status_code in [cp_model.OPTIMAL, cp_model.FEASIBLE]

        if not is_solved:
            diagnostics = InfeasibilityExplainer.diagnose(input_data)
            res = SolverResultDTO(
                schedule_id=input_data.schedule_id,
                status=status_name,
                is_solved=False,
                is_partial=False,
                objective_score=0.0,
                solver_runtime_seconds=runtime_seconds,
                total_shifts_required=sum(r.required_workers for r in input_data.shift_requirements),
                total_shifts_assigned=0,
                total_unfilled_shifts=sum(r.required_workers for r in input_data.shift_requirements),
                hard_violations_count=1,
                assignments=[],
                unfilled_shifts=[],
                diagnostics=diagnostics,
                solver_metadata={"cp_sat_status": status_name, "num_conflicts": solver.NumConflicts()}
            )
            from app.solver.diagnostics.decision_diagnostics_engine import DecisionDiagnosticsEngine
            res.comprehensive_diagnostics = DecisionDiagnosticsEngine.evaluate(
                input_data=input_data,
                result=res,
                solver_obj=solver
            ).model_dump()
            return res

        # Process Assigned Shifts
        assignments: List[SolverAssignmentDTO] = []
        locked_set = {(l.worker_id, str(l.date), l.shift_type_id) for l in input_data.locked_assignments}

        req_map = {(str(r.date), r.shift_type_id): r for r in input_data.shift_requirements}

        dates = [input_data.start_date + timedelta(days=i) for i in range((input_data.end_date - input_data.start_date).days + 1)]
        date_strs = [str(d) for d in dates]

        for (w_id, d_str, s_id), var in shifts_vars.items():
            if solver.Value(var) == 1:
                worker = input_data.workers.get(w_id)
                shift = input_data.shift_types.get(s_id)
                req = req_map.get((d_str, s_id))

                worker_name = f"{worker.first_name} {worker.last_name}" if worker else w_id
                shift_name = shift.name if shift else s_id
                inst_id = req.id if req else f"inst_{d_str}_{s_id}"

                assignments.append(SolverAssignmentDTO(
                    shift_instance_id=inst_id,
                    worker_id=w_id,
                    worker_name=worker_name,
                    date=date.fromisoformat(d_str),
                    shift_type_id=s_id,
                    shift_name=shift_name,
                    is_locked=((w_id, d_str, s_id) in locked_set)
                ))

        # Process Unfilled Shifts
        unfilled_list: List[UnfilledShiftDTO] = []
        total_unfilled = 0
        for (d_str, s_id), u_var in unfilled_vars.items():
            shortage = solver.Value(u_var)
            if shortage > 0:
                total_unfilled += shortage
                shift = input_data.shift_types.get(s_id)
                req = req_map.get((d_str, s_id))
                inst_id = req.id if req else f"inst_{d_str}_{s_id}"

                unfilled_list.append(UnfilledShiftDTO(
                    shift_instance_id=inst_id,
                    date=date.fromisoformat(d_str),
                    shift_type_id=s_id,
                    shift_name=shift.name if shift else s_id,
                    shortage_count=shortage
                ))

        total_req = sum(r.required_workers for r in input_data.shift_requirements)
        total_assigned = len(assignments)
        is_partial = (total_unfilled > 0)

        res = SolverResultDTO(
            schedule_id=input_data.schedule_id,
            status=status_name,
            is_solved=True,
            is_partial=is_partial,
            objective_score=float(solver.ObjectiveValue()),
            solver_runtime_seconds=runtime_seconds,
            total_shifts_required=total_req,
            total_shifts_assigned=total_assigned,
            total_unfilled_shifts=total_unfilled,
            hard_violations_count=0,
            soft_penalty_total=float(solver.ObjectiveValue()),
            assignments=assignments,
            unfilled_shifts=unfilled_list,
            diagnostics=None,
            solver_metadata={
                "cp_sat_status": status_name,
                "wall_time": solver.WallTime(),
                "user_time": solver.UserTime(),
                "num_branches": solver.NumBranches(),
                "num_conflicts": solver.NumConflicts()
            }
        )

        from app.solver.diagnostics.decision_diagnostics_engine import DecisionDiagnosticsEngine
        res.comprehensive_diagnostics = DecisionDiagnosticsEngine.evaluate(
            input_data=input_data,
            result=res,
            solver_obj=solver
        ).model_dump()

        return res
