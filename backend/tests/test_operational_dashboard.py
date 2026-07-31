import unittest
import time
from app.schemas.analytics_dashboard import (
    StaffingWidgetOut,
    OperationalOverviewOut,
    SystemHealthOut,
    EmployeeAnalyticsItem,
    OperationalAlertItem
)
from app.services.system_health_engine import SystemHealthEngine
from app.services.operational_analytics_engine import OperationalAnalyticsEngine
from app.services.operational_alert_engine import OperationalAlertEngine
from app.services.analytics_export_engine import AnalyticsExportEngine


class TestOperationalDashboard(unittest.TestCase):
    def test_health_probe_data_structure(self):
        sys_health = SystemHealthOut(
            overall_status="HEALTHY",
            database={"name": "PostgreSQL", "status": "HEALTHY", "response_time_ms": 1.5},
            redis_cache={"name": "Redis", "status": "HEALTHY", "response_time_ms": 0.5},
            celery_queue={"name": "Celery", "status": "HEALTHY", "response_time_ms": 1.0},
            api_gateway={"name": "API", "status": "HEALTHY", "response_time_ms": 1.2},
            cpu_usage_pct=15.0,
            memory_usage_pct=40.0,
            disk_usage_pct=25.0
        )
        self.assertEqual(sys_health.overall_status, "HEALTHY")
        self.assertEqual(sys_health.cpu_usage_pct, 15.0)

    def test_historical_trends_structure(self):
        trends = OperationalAnalyticsEngine.get_historical_trends(None, granularity="MONTHLY")
        self.assertEqual(trends.granularity, "MONTHLY")
        self.assertGreater(len(trends.trends), 0)

    def test_alert_item_structure(self):
        alert = OperationalAlertItem(
            id="alert-1",
            severity="WARNING",
            category="OVERTIME",
            title="Overtime Warning",
            message="Employee exceeding contract hours",
            timestamp="2026-07-31T10:00:00Z"
        )
        self.assertEqual(alert.severity, "WARNING")
        self.assertEqual(alert.category, "OVERTIME")


if __name__ == "__main__":
    unittest.main()
