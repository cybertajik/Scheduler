import time
import logging
from typing import Tuple, Dict
from ortools.sat.python import cp_model

from app.solver.dtos import (
    SolverInputDTO,
    SolverResultDTO,
    InfeasibilityDiagnosticDTO
)
from app.solver.constraints.hard_constraints import HardConstraintsBuilder
from app.solver.objective.scoring import ObjectiveScorer
from app.solver.translators.result_translator import ResultTranslator
from app.solver.diagnostics.infeasibility_explainer import InfeasibilityExplainer

logger = logging.getLogger(__name__)

class ScheduleSolverService:
    """
    Main domain service orchestrating CP-SAT scheduling model building, solving, scoring, and diagnostics.
    """

    def build_model(
        self,
        input_data: SolverInputDTO
    ) -> Tuple[cp_model.CpModel, Dict[Tuple[str, str, str], cp_model.IntVar], Dict[Tuple[str, str], cp_model.IntVar]]:
        """
        Constructs the CP-SAT CpModel instance, decision variables, hard constraints, and objective function.
        """
        model = cp_model.CpModel()

        # Decision Variables: shifts_vars[(worker_id, date_str, shift_type_id)] = BoolVar
        shifts_vars: Dict[Tuple[str, str, str], cp_model.IntVar] = {}
        dates = [input_data.start_date + __import__('datetime').timedelta(days=i) for i in range((input_data.end_date - input_data.start_date).days + 1)]
        date_strs = [str(d) for d in dates]

        for w_id in input_data.workers.keys():
            for d_str in date_strs:
                for s_id in input_data.shift_types.keys():
                    shifts_vars[(w_id, d_str, s_id)] = model.NewBoolVar(f"x_{w_id}_{d_str}_{s_id}")

        # Unfilled Shift Variables (for partial solution support)
        unfilled_vars: Dict[Tuple[str, str], cp_model.IntVar] = {}
        for req in input_data.shift_requirements:
            d_str = str(req.date)
            unfilled_vars[(d_str, req.shift_type_id)] = model.NewIntVar(
                0, req.required_workers, f"unfilled_{d_str}_{req.shift_type_id}"
            )

        # Apply Hard Constraints
        HardConstraintsBuilder.apply_all(
            model=model,
            input_data=input_data,
            shifts_vars=shifts_vars,
            unfilled_vars=unfilled_vars
        )

        # Apply Soft Constraints & Objective Scoring
        ObjectiveScorer.apply_objective(
            model=model,
            input_data=input_data,
            shifts_vars=shifts_vars,
            unfilled_vars=unfilled_vars
        )

        return model, shifts_vars, unfilled_vars

    def solve(self, input_data: SolverInputDTO) -> SolverResultDTO:
        """
        Solves the scheduling model and returns structured SolverResultDTO.
        """
        start_time = time.time()
        logger.info(f"Starting ScheduleSolverService.solve for range {input_data.start_date} to {input_data.end_date}")

        model, shifts_vars, unfilled_vars = self.build_model(input_data)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = float(input_data.config.time_limit_seconds)
        solver.parameters.num_search_workers = input_data.config.num_search_workers

        status_code = solver.Solve(model)
        runtime = time.time() - start_time

        result = ResultTranslator.translate(
            solver=solver,
            status_code=status_code,
            input_data=input_data,
            shifts_vars=shifts_vars,
            unfilled_vars=unfilled_vars,
            runtime_seconds=runtime
        )

        from datetime import datetime
        diag_summary = result.comprehensive_diagnostics.get("failed_diagnostics", {}).get("summary") if (result.comprehensive_diagnostics and result.comprehensive_diagnostics.get("failed_diagnostics")) else f"Assigned {result.total_shifts_assigned}/{result.total_shifts_required} shifts"

        logger.info(
            f"[SOLVER_RUN] Timestamp={datetime.utcnow().isoformat()} "
            f"Runtime={runtime:.3f}s Objective={result.objective_score} "
            f"Status={result.status} Success={result.is_solved} "
            f"Summary=\"{diag_summary}\""
        )

        return result

    def explain_infeasibility(self, input_data: SolverInputDTO) -> InfeasibilityDiagnosticDTO:
        """
        Generates diagnostic report explaining why a schedule input is infeasible.
        """
        return InfeasibilityExplainer.diagnose(input_data)

    def score_solution(self, result: SolverResultDTO) -> float:
        """
        Returns numeric quality score of the solution.
        """
        return result.objective_score
