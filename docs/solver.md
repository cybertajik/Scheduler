# Google OR-Tools CP-SAT Solver Integration

## Mathematical Model

The solver models schedule generation as a Constraint Satisfaction / Mixed-Integer Programming problem:

### Decision Variables
$$x[w, s, d] \in \{0, 1\}$$
Where $x[w, s, d] = 1$ if worker $w$ is assigned to shift type $s$ on date $d$, and $0$ otherwise.

### Hard Constraints
1. **Demand Satisfaction**:
   $$\sum_{w} x[w, s, d] = \text{required\_workers}(s, d)$$
2. **At Most One Shift Per Day**:
   $$\sum_{s} x[w, s, d] \le 1 \quad \forall w, d$$
3. **Night Shift Rest Rule**:
   $$x[w, \text{night}, d] + x[w, s, d+1] \le 1 \quad \forall s, w, d$$
4. **Locked Assignments**:
   $$x[w, s, d] = 1 \quad \forall (w, s, d) \in \text{LockedAssignments}$$

---

## Objective Function
$$\text{Maximize } \sum \text{Coverage} - \lambda_1 \sum \text{WeekendViolations} - \lambda_2 \sum \text{HourVariance}$$

---

## Infeasibility Handling
If the solver determines that hard constraints cannot be simultaneously satisfied (e.g. insufficient active workers for demanded shifts), it returns `INFEASIBLE` with diagnostic explanation indicating missing headcount or conflicting vacations.
