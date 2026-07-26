import logging
from datetime import timedelta, date
from typing import List, Dict, Tuple, Any
from ortools.sat.python import cp_model

logger = logging.getLogger(__name__)

class ORToolsSchedulerSolver:
    """
    Google OR-Tools CP-SAT Engine for Employee Staff Scheduling
    """
    def __init__(self, time_limit_seconds: int = 30):
        self.time_limit_seconds = time_limit_seconds

    def solve(
        self,
        workers: List[Dict[str, Any]],               # [{'id': 'w1', 'name': 'John', 'no_weekends': False}]
        shift_types: List[Dict[str, Any]],           # [{'id': 's1', 'name': 'Morning', 'is_night': False}]
        demands: List[Dict[str, Any]],               # [{'date': '2026-08-01', 'shift_type_id': 's1', 'required': 2}]
        constraints: List[Dict[str, Any]],           # [{'worker_id': 'w1', 'type': 'VACATION', 'start': date, 'end': date}]
        start_date: date,
        end_date: date
    ) -> Tuple[bool, List[Dict[str, Any]], str]:
        """
        Solves the CP-SAT model and returns (success, assignments, message)
        """
        model = cp_model.CpModel()
        
        # Calculate date list
        num_days = (end_date - start_date).days + 1
        dates = [start_date + timedelta(days=i) for i in range(num_days)]
        
        # Decision Variables: X[w_id, d_str, s_id] = 1 if worker w is assigned to shift s on date d
        shifts_vars = {}
        for w in workers:
            w_id = w['id']
            for d in dates:
                d_str = str(d)
                for s in shift_types:
                    s_id = s['id']
                    shifts_vars[(w_id, d_str, s_id)] = model.NewBoolVar(f"shift_w{w_id}_d{d_str}_s{s_id}")

        # 1. Hard Constraint: Headcount Demand for each (date, shift_type)
        demand_map = {(str(d['date']), d['shift_type_id']): d['required_count'] for d in demands}
        for d in dates:
            d_str = str(d)
            for s in shift_types:
                s_id = s['id']
                req = demand_map.get((d_str, s_id), 0)
                if req > 0:
                    model.Add(sum(shifts_vars[(w['id'], d_str, s_id)] for w in workers) == req)

        # 2. Hard Constraint: At most 1 shift per worker per day
        for w in workers:
            w_id = w['id']
            for d in dates:
                d_str = str(d)
                model.Add(sum(shifts_vars[(w_id, d_str, s['id'])] for s in shift_types) <= 1)

        # 3. Hard Constraint: Worker Constraints (Unavailability, Vacations, Shift Restrictions, No Weekends)
        for c in constraints:
            w_id = c['worker_id']
            c_type = c['constraint_type']
            c_start = c['start_date']
            c_end = c['end_date']
            c_shift_type = c.get('shift_type_id')

            for d in dates:
                if c_start <= d <= c_end:
                    d_str = str(d)
                    if c_type in ["DATE_UNAVAILABLE", "VACATION"]:
                        for s in shift_types:
                            if (w_id, d_str, s['id']) in shifts_vars:
                                model.Add(shifts_vars[(w_id, d_str, s['id'])] == 0)
                    elif c_type == "SHIFT_RESTRICTION" and c_shift_type:
                        if (w_id, d_str, c_shift_type) in shifts_vars:
                            model.Add(shifts_vars[(w_id, d_str, c_shift_type)] == 0)
                    elif c_type == "NO_WEEKENDS" and d.weekday() >= 5: # 5=Saturday, 6=Sunday
                        for s in shift_types:
                            if (w_id, d_str, s['id']) in shifts_vars:
                                model.Add(shifts_vars[(w_id, d_str, s['id'])] == 0)

        # 4. Hard Constraint: Night Shift Rest Rule (Next day off after night shift)
        night_shift_ids = [s['id'] for s in shift_types if s.get('is_night_shift')]
        if night_shift_ids:
            for w in workers:
                w_id = w['id']
                for day_idx in range(num_days - 1):
                    d_curr = str(dates[day_idx])
                    d_next = str(dates[day_idx + 1])
                    for night_id in night_shift_ids:
                        for s_next in shift_types:
                            # If worked night shift on d_curr, cannot work any shift on d_next
                            model.Add(shifts_vars[(w_id, d_curr, night_id)] + shifts_vars[(w_id, d_next, s_next['id'])] <= 1)

        # 5. Objective Function: Fair Workload Distribution across workers
        # Minimize total difference from target average shifts
        total_shifts_worker = [sum(shifts_vars[(w['id'], str(d), s['id'])] for d in dates for s in shift_types) for w in workers]
        # Soft optimization: minimize maximum shifts assigned to any single worker
        max_shifts = model.NewIntVar(0, num_days, "max_shifts")
        for worker_total in total_shifts_worker:
            model.Add(worker_total <= max_shifts)
        model.Minimize(max_shifts)

        # Solve Model
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit_seconds
        status = solver.Solve(model)

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            solution_assignments = []
            for w in workers:
                w_id = w['id']
                for d in dates:
                    d_str = str(d)
                    for s in shift_types:
                        s_id = s['id']
                        if solver.Value(shifts_vars[(w_id, d_str, s_id)]) == 1:
                            solution_assignments.append({
                                'date': d_str,
                                'worker_id': w_id,
                                'shift_type_id': s_id,
                                'is_manual_override': False,
                                'has_conflict': False
                            })
            msg = f"Schedule solved successfully! Status: {solver.StatusName(status)}"
            logger.info(msg)
            return True, solution_assignments, msg
        else:
            msg = f"Schedule generation failed or infeasible. Status: {solver.StatusName(status)}"
            logger.warning(msg)
            return False, [], msg
