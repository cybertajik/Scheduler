from datetime import date, timedelta
from typing import Dict, Tuple, List
from ortools.sat.python import cp_model
from app.solver.dtos import SolverInputDTO
from app.rules.enums import RuleType, RuleCategory

class HardConstraintsBuilder:
    """
    Constructs all CP-SAT hard constraints for the solver model.
    """

    @staticmethod
    def apply_all(
        model: cp_model.CpModel,
        input_data: SolverInputDTO,
        shifts_vars: Dict[Tuple[str, str, str], cp_model.IntVar],  # (worker_id, date_str, shift_type_id) -> BoolVar
        unfilled_vars: Dict[Tuple[str, str], cp_model.IntVar]     # (date_str, shift_type_id) -> IntVar
    ):
        dates = [input_data.start_date + timedelta(days=i) for i in range((input_data.end_date - input_data.start_date).days + 1)]
        date_strs = [str(d) for d in dates]

        # 1. Coverage Demands: For each shift requirement on a date
        req_map = {(str(r.date), r.shift_type_id): r for r in input_data.shift_requirements}
        for (d_str, s_id), req in req_map.items():
            assigned_sum = sum(shifts_vars[(w_id, d_str, s_id)] for w_id in input_data.workers.keys() if (w_id, d_str, s_id) in shifts_vars)
            unfilled_var = unfilled_vars.get((d_str, s_id))
            if unfilled_var is not None:
                # assigned + unfilled == required_workers
                model.Add(assigned_sum + unfilled_var == req.required_workers)
            else:
                model.Add(assigned_sum == req.required_workers)

        # 2. At most 1 shift per worker per day
        for w_id in input_data.workers.keys():
            for d_str in date_strs:
                model.Add(sum(shifts_vars[(w_id, d_str, s_id)] for s_id in input_data.shift_types.keys() if (w_id, d_str, s_id) in shifts_vars) <= 1)

        # 3. Locked Assignments Protection
        for lock in input_data.locked_assignments:
            key = (lock.worker_id, str(lock.date), lock.shift_type_id)
            if key in shifts_vars:
                model.Add(shifts_vars[key] == 1)

        # 4. Worker Constraints (Vacation, Unavailability, Weekend, Night, Shift Restrictions)
        for c in input_data.worker_constraints:
            if not c.enabled or c.category != RuleCategory.HARD:
                continue

            w_id = c.worker_id
            if w_id not in input_data.workers:
                continue

            for d in dates:
                if c.start_date <= d <= c.end_date:
                    d_str = str(d)

                    if c.rule_type in [RuleType.VACATION, RuleType.UNAVAILABLE_DATE, RuleType.UNAVAILABLE_RANGE]:
                        for s_id in input_data.shift_types.keys():
                            if (w_id, d_str, s_id) in shifts_vars:
                                model.Add(shifts_vars[(w_id, d_str, s_id)] == 0)

                    elif c.rule_type == RuleType.NO_WEEKENDS and d.weekday() >= 5:
                        for s_id in input_data.shift_types.keys():
                            if (w_id, d_str, s_id) in shifts_vars:
                                model.Add(shifts_vars[(w_id, d_str, s_id)] == 0)

                    elif c.rule_type == RuleType.NO_NIGHTS:
                        for s_id, s_dto in input_data.shift_types.items():
                            if s_dto.is_night_shift and (w_id, d_str, s_id) in shifts_vars:
                                model.Add(shifts_vars[(w_id, d_str, s_id)] == 0)

                    elif c.rule_type == RuleType.NO_SHIFT_TYPE and c.metadata_json:
                        restricted_id = c.metadata_json.get("shift_type_id")
                        if restricted_id and (w_id, d_str, restricted_id) in shifts_vars:
                            model.Add(shifts_vars[(w_id, d_str, restricted_id)] == 0)

        # 5. Post-Night Shift Rest Rule (Next day off after working a night shift)
        night_shift_ids = [s_id for s_id, s_dto in input_data.shift_types.items() if s_dto.is_night_shift]
        if night_shift_ids:
            for w_id in input_data.workers.keys():
                for idx in range(len(dates) - 1):
                    curr_d_str = date_strs[idx]
                    next_d_str = date_strs[idx + 1]
                    for night_id in night_shift_ids:
                        if (w_id, curr_d_str, night_id) in shifts_vars:
                            for any_s_id in input_data.shift_types.keys():
                                if (w_id, next_d_str, any_s_id) in shifts_vars:
                                    model.Add(shifts_vars[(w_id, curr_d_str, night_id)] + shifts_vars[(w_id, next_d_str, any_s_id)] <= 1)

        # 6. Maximum Consecutive Working Days Rule
        for w_id in input_data.workers.keys():
            max_days = 6  # Default limit
            for c in input_data.worker_constraints:
                if c.worker_id == w_id and c.enabled and c.rule_type == RuleType.MAX_CONSECUTIVE_DAYS and c.category == RuleCategory.HARD:
                    if c.metadata_json and "max_days" in c.metadata_json:
                        max_days = int(c.metadata_json["max_days"])
                        break

            window_len = max_days + 1
            if len(dates) >= window_len:
                for idx in range(len(dates) - window_len + 1):
                    window_dates = date_strs[idx : idx + window_len]
                    daily_worked_vars = []
                    for d_str in window_dates:
                        day_worked = model.NewBoolVar(f"worked_{w_id}_{d_str}")
                        model.Add(sum(shifts_vars[(w_id, d_str, s_id)] for s_id in input_data.shift_types.keys() if (w_id, d_str, s_id) in shifts_vars) == day_worked)
                        daily_worked_vars.append(day_worked)
                    model.Add(sum(daily_worked_vars) <= max_days)
