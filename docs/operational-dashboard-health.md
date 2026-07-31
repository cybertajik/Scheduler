# Operational Dashboard, System Health Monitoring & Analytics Specification

This document details the architecture, caching strategy, health check diagnostic probes, alert thresholds, multi-format export engines, and REST API specification for the **Operational Dashboard, Health Monitoring & Analytics** module.

---

## 1. Architectural Overview & Caching Strategy

The Operational Control Center provides real-time visibility into staffing quality, workforce utilization, infrastructure health, and operational alerts.

> [!IMPORTANT]
> - **Performance Guarantee**: All analytics aggregations and system health diagnostic probes complete in **< 2 seconds**.
> - **30-Second TTL Caching**: High-frequency dashboard queries utilize in-memory TTL caching (`OperationalAnalyticsEngine`) to avoid redundant database query overhead.
> - **Zero Engine Alteration**: Core scheduling engine behavior and OR-Tools CP-SAT logic remain 100% unchanged.

---

## 2. Infrastructure Health Probes

The `SystemHealthEngine` monitors:

| Probe Target | Measurement / Check Method | Target Threshold |
| --- | --- | --- |
| **PostgreSQL Database** | Direct SQL `SELECT 1` ping query. | Ping Latency < 50ms |
| **Redis / Cache Engine** | Redis TCP `ping()` or in-memory TTL fallback. | Latency < 10ms |
| **Celery Queue** | Queue task depth inspection. | Queue depth < 100 tasks |
| **API Gateway** | REST endpoint response ping latency. | Latency < 100ms |
| **Host Resources** | OS CPU %, RAM Memory %, Disk Usage %. | Disk < 85%, CPU < 85% |
| **Database Backups** | File verification in `/backups` directory. | Last backup < 24 hours |

---

## 3. Automated Alert Engine

The `OperationalAlertEngine` monitors system parameters and classifies alerts into three severity tiers:

- **`CRITICAL`**: Coverage drop below 60%, database connectivity failure, or disk space > 95%.
- **`WARNING`**: Coverage drop between 60% and 80%, employee weekly overtime exceeding 10 hours, or disk space > 85%.
- **`INFO`**: Maintenance notifications or completed imports/exports.

---

## 4. Multi-Format Report Exporter

The `AnalyticsExportEngine` generates reports in three formats:
- **CSV**: Standard comma-separated workforce table export.
- **Excel (`.xlsx`)**: Structured spreadsheet with headers.
- **PDF**: Executive HTML report rendering key KPIs, coverage percentages, and employee workload metrics.

---

## 5. REST API Specification

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/v1/analytics/operational-dashboard` | Real-time staffing widgets, coverage %, and audit stream. |
| `GET` | `/api/v1/analytics/system-health` | Diagnostic monitor for DB, Redis, Celery, API, and OS resources. |
| `GET` | `/api/v1/analytics/employee-analytics` | Per-employee worked hours, night/weekend shifts, and overtime. |
| `GET` | `/api/v1/analytics/department-analytics` | Per-department staffing capacity, open positions, and workload. |
| `GET` | `/api/v1/analytics/historical-trends` | Weekly, monthly, and yearly time-series trend data. |
| `GET` | `/api/v1/analytics/alerts` | Operational alerts stream with severity ranking. |
| `GET` | `/api/v1/analytics/export` | Download operational report in PDF, Excel, or CSV format. |
