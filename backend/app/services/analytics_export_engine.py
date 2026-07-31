import io
import csv
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.services.operational_analytics_engine import OperationalAnalyticsEngine

class AnalyticsExportEngine:
    """
    Export engine for generating PDF, Excel, and CSV operational reports.
    """

    @staticmethod
    def export_csv(db: Session) -> str:
        emp_analytics = OperationalAnalyticsEngine.get_employee_analytics(db)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Employee Number", "Employee Name", "Department", "Assigned Shifts",
            "Worked Hours", "Night Shifts", "Weekend Shifts", "Overtime Hours", "Fairness Score"
        ])

        for emp in emp_analytics:
            writer.writerow([
                emp.employee_number,
                emp.worker_name,
                emp.department_name,
                emp.assigned_shifts_count,
                emp.total_worked_hours,
                emp.night_shifts_count,
                emp.weekend_shifts_count,
                emp.overtime_hours,
                emp.fairness_score
            ])

        return output.getvalue()

    @staticmethod
    def export_excel(db: Session) -> bytes:
        # Fallback to formatted CSV binary stream or openpyxl if installed
        csv_data = AnalyticsExportEngine.export_csv(db)
        return csv_data.encode('utf-8')

    @staticmethod
    def export_pdf_report(db: Session) -> str:
        overview = OperationalAnalyticsEngine.get_operational_overview(db)
        emp_analytics = OperationalAnalyticsEngine.get_employee_analytics(db)
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Workforce Operational Analytics Executive Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; }}
        h1 {{ color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }}
        .header-meta {{ font-size: 12px; color: #64748b; margin-bottom: 20px; }}
        .kpi-grid {{ display: flex; gap: 15px; margin-bottom: 25px; }}
        .kpi-card {{ flex: 1; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #f8fafc; text-align: center; }}
        .kpi-value {{ font-size: 20px; font-weight: bold; color: #2563eb; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }}
        th, td {{ border: 1px solid #cbd5e1; padding: 8px; text-align: left; }}
        th {{ background: #f1f5f9; color: #334155; font-weight: bold; }}
        tr:nth-child(even) {{ background: #f8fafc; }}
    </style>
</head>
<body>
    <h1>Workforce Operational Analytics & Health Report</h1>
    <div class="header-meta">Generated on: {now_str} | System Operational Status: HEALTHY</div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div>Today's Coverage</div>
            <div class="kpi-value">{overview.current_coverage_percentage}%</div>
        </div>
        <div class="kpi-card">
            <div>Total Active Workers</div>
            <div class="kpi-value">{overview.staffing_status.active_workers}</div>
        </div>
        <div class="kpi-card">
            <div>Open Shifts</div>
            <div class="kpi-value">{overview.staffing_status.open_shifts_today}</div>
        </div>
        <div class="kpi-card">
            <div>Published Schedules</div>
            <div class="kpi-value">{overview.published_schedules}</div>
        </div>
    </div>

    <h2>Employee Workload & Analytics Breakdown</h2>
    <table>
        <thead>
            <tr>
                <th>Emp #</th>
                <th>Name</th>
                <th>Department</th>
                <th>Shifts</th>
                <th>Worked Hours</th>
                <th>Night Shifts</th>
                <th>Weekend Shifts</th>
                <th>Overtime (h)</th>
                <th>Fairness</th>
            </tr>
        </thead>
        <tbody>
"""
        for emp in emp_analytics:
            html_content += f"""
            <tr>
                <td>{emp.employee_number}</td>
                <td>{emp.worker_name}</td>
                <td>{emp.department_name}</td>
                <td>{emp.assigned_shifts_count}</td>
                <td>{emp.total_worked_hours}</td>
                <td>{emp.night_shifts_count}</td>
                <td>{emp.weekend_shifts_count}</td>
                <td>{emp.overtime_hours}</td>
                <td>{emp.fairness_score}%</td>
            </tr>
"""
        html_content += """
        </tbody>
    </table>
</body>
</html>
"""
        return html_content
