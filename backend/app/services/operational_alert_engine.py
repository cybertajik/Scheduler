import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from app.schemas.analytics_dashboard import OperationalAlertItem
from app.services.system_health_engine import SystemHealthEngine
from app.services.operational_analytics_engine import OperationalAnalyticsEngine

class OperationalAlertEngine:
    """
    Engine for generating operational and system health alerts with severity tiers and suggested actions.
    """

    @staticmethod
    def get_alerts(db: Session) -> List[OperationalAlertItem]:
        alerts: List[OperationalAlertItem] = []
        now_str = datetime.now(timezone.utc).isoformat()

        # 1. System Health Checks
        health = SystemHealthEngine.get_system_health(db)
        if health.disk_usage_pct > 85.0:
            alerts.append(OperationalAlertItem(
                id=str(uuid.uuid4()),
                severity="WARNING" if health.disk_usage_pct < 95.0 else "CRITICAL",
                category="SYSTEM",
                title="Disk Space Warning",
                message=f"Host disk usage is at {health.disk_usage_pct}%. Low disk capacity may cause database logging errors.",
                timestamp=now_str,
                suggested_action="Purge temp log files or expand volume storage."
            ))

        if health.database.status != "HEALTHY":
            alerts.append(OperationalAlertItem(
                id=str(uuid.uuid4()),
                severity="CRITICAL",
                category="SYSTEM",
                title="Database Connectivity Failure",
                message=f"PostgreSQL Database returned status '{health.database.status}'.",
                timestamp=now_str,
                suggested_action="Verify PostgreSQL daemon and network credentials."
            ))

        # 2. Staffing & Coverage Checks
        overview = OperationalAnalyticsEngine.get_operational_overview(db)
        cov = overview.current_coverage_percentage
        if cov < 80.0 and overview.staffing_status.required_workers_today > 0:
            alerts.append(OperationalAlertItem(
                id=str(uuid.uuid4()),
                severity="CRITICAL" if cov < 60.0 else "WARNING",
                category="STAFFING",
                title="Staffing Coverage Deficit",
                message=f"Today's schedule coverage is {cov}%, falling below target threshold (80%). {overview.staffing_status.open_shifts_today} open shift(s) remaining.",
                timestamp=now_str,
                suggested_action="Run solver re-optimization or assign standby employees."
            ))

        # 3. Overtime Checks
        emp_analytics = OperationalAnalyticsEngine.get_employee_analytics(db)
        overtime_workers = [w for w in emp_analytics if w.overtime_hours > 10.0]
        if overtime_workers:
            names = ", ".join(w.worker_name for w in overtime_workers[:3])
            alerts.append(OperationalAlertItem(
                id=str(uuid.uuid4()),
                severity="WARNING",
                category="OVERTIME",
                title="Excessive Weekly Overtime",
                message=f"{len(overtime_workers)} employee(s) exceeding 10 hours overtime ({names}).",
                timestamp=now_str,
                suggested_action="Rebalance workload across part-time or under-utilized employees."
            ))

        return alerts
