import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_admin
from app.models import User, Schedule
from app.services.export_service import ExportService
from app.services.import_service import ImportService
from app.services.audit_service import AuditService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/export/schedule/{schedule_id}")
def export_schedule(
    schedule_id: str,
    format: str = "csv",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export schedule in CSV, Excel (.xlsx), or JSON format."""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found.")

    AuditService.log_action(
        db=db,
        action="EXPORT_SCHEDULE",
        entity_type="Schedule",
        entity_id=schedule_id,
        user_id=current_user.id,
        who=f"{current_user.first_name} {current_user.last_name}",
        reason=f"Exported in format {format.upper()}",
    )

    fmt = format.lower()
    if fmt == "csv":
        csv_data = ExportService.export_schedule_csv(db, schedule)
        filename = f"schedule_{schedule.name.replace(' ', '_')}.csv"
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    elif fmt in ["xlsx", "excel"]:
        excel_bytes = ExportService.export_schedule_excel(db, schedule)
        filename = f"schedule_{schedule.name.replace(' ', '_')}.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    elif fmt == "json":
        json_obj = ExportService.export_schedule_json(db, schedule)
        return json_obj
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Supported: csv, xlsx, json.")

@router.get("/export/workers")
def export_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export worker roster as CSV."""
    csv_data = ExportService.export_workers_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=workers_export.csv"}
    )

@router.get("/export/audit-log")
def export_audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Export audit log entries as CSV."""
    csv_data = ExportService.export_audit_log_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log_export.csv"}
    )

@router.post("/import/validate-workers")
async def validate_workers_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Dry-run validation for worker import file (CSV or XLSX).
    Returns valid record count, warnings, and errors.
    """
    contents = await file.read()
    try:
        rows = ImportService.parse_file_rows(contents, file.filename or "import.csv")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    valid_records, warnings, errors = ImportService.validate_workers_import(db, rows)

    return {
        "filename": file.filename,
        "total_rows": len(rows),
        "valid_count": len(valid_records),
        "warnings_count": len(warnings),
        "errors_count": len(errors),
        "valid_records": valid_records,
        "warnings": warnings,
        "errors": errors
    }

@router.post("/import/commit-workers")
def commit_workers_import(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Execute transactional import of validated worker records."""
    valid_records = payload.get("valid_records", [])
    if not valid_records:
        raise HTTPException(status_code=400, detail="No valid records provided for import.")

    try:
        count = ImportService.execute_workers_import(db, valid_records)
        AuditService.log_action(
            db=db,
            action="IMPORT_WORKERS",
            entity_type="Worker",
            user_id=current_user.id,
            who=f"{current_user.first_name} {current_user.last_name}",
            reason=f"Imported {count} worker records via CSV/Excel wizard",
        )
        return {
            "status": "success",
            "imported_count": count,
            "message": f"Successfully imported {count} workers."
        }
    except Exception as e:
        logger.exception("Worker import commit failed")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
