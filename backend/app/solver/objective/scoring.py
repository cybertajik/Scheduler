from datetime import date, timedelta
from typing import Dict, Tuple, List
from ortools.sat.python import cp_model
from app.solver.dtos import SolverInputDTO
from app.rules.enums import RuleType, RuleCategory

class ObjectiveScorer:
    """
    Constructs the objective function combining unfilled penalties, soft constraints, and fairness.
    """

    @staticmethod
    def apply_objective(
        model: cp_model.CpModel,
        input_data: SolverInputDTO,
        shifts_vars: Dict[Tuple[str, str, str], cp_model.IntVar],
        unfilled_vars: Dict[Tuple[str, str], cp_model.IntVar]
    ):
        dates = [input_data.start_date + timedelta(days=i) for i in range((input_data.end_date - input_data.start_date).days + 1)]
        date_strs = [str(d) for d in dates]
        num_days = len(dates)

        objective_terms = []

        # 1. Unfilled Shift Penalties
        for (d_str, s_id), unfilled_var in unfilled_vars.items():
            objective_terms.append(unfilled_var * input_data.config.unfilled_shift_penalty)

        # 2. Soft Rule Violations Penalties
        for c in input_data.worker_constraints:
            if not c.enabled or c.category != RuleCategory.SOFT:
                continue

            w_id = c.worker_id
            if w_id not in input_data.workers:
                continue

            for d in dates:
                if c.start_date <= d <= c.end_date:
                    d_str = str(d)
                    if c.rule_type == RuleType.PREFERRED_DAYS_OFF:
                        for s_id in input_data.shift_types.keys():
                            if (w_id, d_str, s_id) in shifts_vars:
                                objective_terms.append(shifts_vars[(w_id, d_str, s_id)] * input_data.config.soft_penalty_weight * 10)

                    elif c.rule_type == RuleType.PREFERRED_SHIFTS and c.metadata_json:
                        pref_id = c.metadata_json.get("shift_type_id")
                        if pref_id:
                            for s_id in input_data.shift_types.keys():
                                if s_id != pref_id and (w_id, d_str, s_id) in shifts_vars:
                                    objective_terms.append(shifts_vars[(w_id, d_str, s_id)] * input_data.config.soft_penalty_weight * 5)

        # 3. Workload Fairness: Minimize max total shifts assigned to any worker
        worker_totals = []
        for w_id in input_data.workers.keys():
            worker_total = sum(
                shifts_vars[(w_id, d_str, s_id)]
                for d_str in date_strs
                for s_id in input_data.shift_types.keys()
                if (w_id, d_str, s_id) in shifts_vars
            )
            worker_totals.append(worker_total)

        if worker_totals:
            max_workload = model.NewIntVar(0, num_days, "max_workload")
            for w_total in worker_totals:
                model.Add(w_total <= max_workload)
            objective_terms.append(max_workload * input_data.config.workload_fairness_weight)

        # 4. Night Shift Fairness: Minimize max night shifts assigned to any worker
        night_shift_ids = [s_id for s_id, s_dto in input_data.shift_types.items() if s_dto.is_night_shift]
        if night_shift_ids:
            night_totals = []
            for w_id in input_data.workers.keys():
                w_nights = sum(
                    shifts_vars[(w_id, d_str, night_id)]
                    for d_str in date_strs
                    for night_id in night_shift_ids
                    if (w_id, d_str, night_id) in shifts_vars
                )
                night_totals.append(w_nights)

            max_nights = model.NewIntVar(0, num_days, "max_nights")
            for n_total in night_totals:
                model.Add(n_total <= max_nights)
            objective_terms.append(max_nights * input_data.config.night_fairness_weight)

        # Minimize sum of all penalty terms
        model.Minimize(sum(objective_terms))
