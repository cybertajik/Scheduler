from datetime import date
from app.services.solver_service import ORToolsSchedulerSolver

def test_ortools_solver_basic():
    solver = ORToolsSchedulerSolver(time_limit_seconds=10)
    
    workers = [
        {'id': 'w1', 'name': 'Alice'},
        {'id': 'w2', 'name': 'Bob'}
    ]
    shift_types = [
        {'id': 's1', 'name': 'Morning', 'is_night_shift': False}
    ]
    demands = [
        {'date': date(2026, 8, 1), 'shift_type_id': 's1', 'required_count': 1}
    ]
    constraints = []

    success, assignments, msg = solver.solve(
        workers=workers,
        shift_types=shift_types,
        demands=demands,
        constraints=constraints,
        start_date=date(2026, 8, 1),
        end_date=date(2026, 8, 1)
    )

    assert success is True
    assert len(assignments) == 1
    assert assignments[0]['shift_type_id'] == 's1'
