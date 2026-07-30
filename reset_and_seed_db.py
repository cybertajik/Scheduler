"""
Database Reset & Seed Script
=============================
Connects to the remote server via SSH and:
1. Drops all tables and recreates the schema
2. Seeds with: 1 Admin, 1 Manager, 15 Employees
3. Creates departments, shift types, skills
4. Creates schedules for past 1 month + next 6 months only
"""
import sys
import paramiko
import re
import time
import json
import textwrap

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "192.168.0.5"
USER = "ad"
PASS = "!23QWEasd"

def strip_ansi(t):
    t = re.sub(r'\x1b\[[0-9;?]*[mGKHFJA]', '', t)
    t = re.sub(r'[\r\x07]', '', t)
    return t

def ssh_exec(client, cmd, timeout=120):
    transport = client.get_transport()
    chan = transport.open_session()
    chan.get_pty()
    chan.set_combine_stderr(True)
    chan.exec_command(cmd)
    output = b""
    deadline = time.time() + timeout
    while not chan.exit_status_ready():
        if time.time() > deadline:
            print("[TIMEOUT]")
            break
        if chan.recv_ready():
            output += chan.recv(8192)
        else:
            time.sleep(0.1)
    while chan.recv_ready():
        output += chan.recv(8192)
    chan.close()
    return strip_ansi(output.decode('utf-8', errors='replace'))

# The seed Python script to run inside the backend container
SEED_SCRIPT = r'''
import uuid
import bcrypt
from datetime import datetime, date, time, timedelta, timezone

from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models import *
from app.models.enums import *
from app.models.shift import ShiftType, ShiftInstance
from app.models.schedule import Schedule, Assignment
from app.models.constraint import WorkerConstraint
from app.models.worker import Worker, Skill, WorkerSkill
from app.models.department import Department
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.organization import Organization

def hash_pw(pw):
    return bcrypt.hashpw(pw.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

print("=== DROPPING ALL TABLES ===")
Base.metadata.drop_all(bind=engine)
print("=== RECREATING ALL TABLES ===")
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # ── 1. Admin User ──
    print("Creating Admin user...")
    admin = User(
        id=uuid.uuid4(),
        username="admin",
        email="admin@admin.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="System",
        last_name="Administrator",
        role=UserRole.ADMIN,
        active=True,
        preferred_language="en",
        theme_preference="dark",
    )
    db.add(admin)
    db.flush()

    # ── 2. Departments ──
    print("Creating departments...")
    dept_names = ["Operations", "Kitchen", "Front Desk"]
    depts = {}
    for name in dept_names:
        d = Department(id=uuid.uuid4(), name=name, description=f"{name} department")
        db.add(d)
        depts[name] = d
    db.flush()

    # ── 3. Skills ──
    print("Creating skills...")
    skill_names = ["First Aid", "Food Safety", "Cash Register", "Inventory", "Customer Service"]
    skills = {}
    for name in skill_names:
        s = Skill(id=uuid.uuid4(), name=name, description=f"{name} certification")
        db.add(s)
        skills[name] = s
    db.flush()

    # ── 4. Shift Types ──
    print("Creating shift types...")
    shift_types_data = [
        ("Morning",  "#22C55E", time( 6, 0), time(14, 0), 8.0, False, False),
        ("Day",      "#3B82F6", time( 9, 0), time(17, 0), 8.0, False, False),
        ("Evening",  "#F59E0B", time(14, 0), time(22, 0), 8.0, False, False),
        ("Night",    "#EF4444", time(22, 0), time( 6, 0), 8.0, True,  True),
    ]
    shift_types = {}
    for name, color, st, et, dur, night, rest in shift_types_data:
        s = ShiftType(
            id=uuid.uuid4(), name=name, color=color,
            start_time=st, end_time=et, duration=dur,
            is_night_shift=night, requires_rest_day=rest,
        )
        db.add(s)
        shift_types[name] = s
    db.flush()

    # ── 5. Manager User + Worker ──
    print("Creating Manager...")
    mgr_user = User(
        id=uuid.uuid4(),
        username="manager1",
        email="manager@scheduler.local",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Sarah",
        last_name="Johnson",
        role=UserRole.MANAGER,
        active=True,
        preferred_language="en",
        theme_preference="dark",
    )
    db.add(mgr_user)
    db.flush()
    mgr_worker = Worker(
        id=uuid.uuid4(),
        employee_number="MGR-001",
        department_id=depts["Operations"].id,
        user_id=mgr_user.id,
        first_name="Sarah",
        last_name="Johnson",
        phone="+1-555-0100",
        email="manager@scheduler.local",
        hire_date=date(2023, 1, 15),
        weekly_contract_hours=40.0,
        contract_type=ContractType.SALARY,
        monthly_salary=5500.0,
        active=True,
    )
    db.add(mgr_worker)
    db.flush()

    # ── 6. 15 Employees ──
    print("Creating 15 employees...")
    employees_data = [
        ("emp01", "James",    "Miller",    "Operations",  "+1-555-0101", "james.miller@scheduler.local",    date(2023, 3, 1),  38.0, "HOURLY", 18.50),
        ("emp02", "Emily",    "Davis",     "Operations",  "+1-555-0102", "emily.davis@scheduler.local",     date(2023, 4, 15), 40.0, "HOURLY", 19.00),
        ("emp03", "Michael",  "Wilson",    "Operations",  "+1-555-0103", "michael.wilson@scheduler.local",  date(2023, 5, 1),  36.0, "HOURLY", 17.50),
        ("emp04", "Jessica",  "Brown",     "Kitchen",     "+1-555-0104", "jessica.brown@scheduler.local",   date(2023, 6, 1),  40.0, "SALARY", 3200.0),
        ("emp05", "Daniel",   "Taylor",    "Kitchen",     "+1-555-0105", "daniel.taylor@scheduler.local",   date(2023, 7, 15), 40.0, "HOURLY", 20.00),
        ("emp06", "Ashley",   "Anderson",  "Kitchen",     "+1-555-0106", "ashley.anderson@scheduler.local", date(2023, 8, 1),  32.0, "HOURLY", 17.00),
        ("emp07", "David",    "Thomas",    "Kitchen",     "+1-555-0107", "david.thomas@scheduler.local",    date(2024, 1, 10), 40.0, "HOURLY", 18.00),
        ("emp08", "Sarah",    "Jackson",   "Kitchen",     "+1-555-0108", "sarah.jackson@scheduler.local",   date(2024, 2, 1),  38.0, "SALARY", 3000.0),
        ("emp09", "Robert",   "White",     "Front Desk",  "+1-555-0109", "robert.white@scheduler.local",    date(2024, 3, 15), 40.0, "HOURLY", 19.50),
        ("emp10", "Jennifer", "Harris",    "Front Desk",  "+1-555-0110", "jennifer.harris@scheduler.local", date(2024, 4, 1),  36.0, "HOURLY", 18.00),
        ("emp11", "William",  "Martin",    "Front Desk",  "+1-555-0111", "william.martin@scheduler.local",  date(2024, 5, 1),  40.0, "SALARY", 3400.0),
        ("emp12", "Amanda",   "Garcia",    "Front Desk",  "+1-555-0112", "amanda.garcia@scheduler.local",   date(2024, 6, 15), 32.0, "HOURLY", 17.50),
        ("emp13", "Thomas",   "Martinez",  "Operations",  "+1-555-0113", "thomas.martinez@scheduler.local", date(2024, 8, 1),  40.0, "HOURLY", 19.00),
        ("emp14", "Lisa",     "Robinson",  "Operations",  "+1-555-0114", "lisa.robinson@scheduler.local",   date(2024, 9, 15), 38.0, "HOURLY", 18.50),
        ("emp15", "Christopher","Clark",   "Kitchen",     "+1-555-0115", "chris.clark@scheduler.local",     date(2024, 10, 1), 40.0, "SALARY", 3100.0),
    ]

    emp_workers = []
    for num, first, last, dept, phone, email, hire, hours, ctype, pay in employees_data:
        u = User(
            id=uuid.uuid4(),
            username=num,
            email=email,
            password_hash=hash_pw("!23QWEasd"),
            first_name=first,
            last_name=last,
            role=UserRole.EMPLOYEE,
            active=True,
            preferred_language="en",
            theme_preference="dark",
        )
        db.add(u)
        db.flush()

        w = Worker(
            id=uuid.uuid4(),
            employee_number=num.upper(),
            department_id=depts[dept].id,
            user_id=u.id,
            first_name=first,
            last_name=last,
            phone=phone,
            email=email,
            hire_date=hire,
            weekly_contract_hours=hours,
            contract_type=ContractType.SALARY if ctype == "SALARY" else ContractType.HOURLY,
            hourly_rate=pay if ctype == "HOURLY" else None,
            monthly_salary=pay if ctype == "SALARY" else None,
            active=True,
        )
        db.add(w)
        emp_workers.append(w)
    db.flush()

    # Assign skills to workers (round-robin)
    skill_list = list(skills.values())
    for i, w in enumerate(emp_workers):
        assigned = [skill_list[i % len(skill_list)], skill_list[(i + 2) % len(skill_list)]]
        for sk in assigned:
            ws = WorkerSkill(worker_id=w.id, skill_id=sk.id)
            db.add(ws)
    db.flush()

    # ── 7. Schedules: past 1 month + next 6 months ──
    print("Creating schedule periods (past 1 month + next 6 months)...")
    today = date.today()
    # Past 1 month
    if today.month == 1:
        past_month, past_year = 12, today.year - 1
    else:
        past_month, past_year = today.month - 1, today.year

    schedule_periods = [(past_month, past_year)]
    # Current month + next 6
    m, y = today.month, today.year
    for _ in range(7):
        schedule_periods.append((m, y))
        m += 1
        if m > 12:
            m = 1
            y += 1

    all_workers = [mgr_worker] + emp_workers
    shift_type_list = list(shift_types.values())

    for month, year in schedule_periods:
        status = ScheduleStatus.PUBLISHED if (year < today.year or (year == today.year and month < today.month)) else ScheduleStatus.DRAFT
        sched = Schedule(
            id=uuid.uuid4(),
            month=month,
            year=year,
            status=status,
            generated_by=admin.id if status == ScheduleStatus.PUBLISHED else None,
            generated_at=datetime.now(timezone.utc) if status == ScheduleStatus.PUBLISHED else None,
            solver_score="optimal (100%)" if status == ScheduleStatus.PUBLISHED else None,
        )
        db.add(sched)
        db.flush()

    # ── 8. Sample constraints (vacations) ──
    print("Creating sample constraints...")
    # Give 3 workers a vacation in a future month
    for i, w in enumerate(emp_workers[:3]):
        vac_start = today + timedelta(days=30 + i*14)
        vac_end = vac_start + timedelta(days=6)
        c = WorkerConstraint(
            id=uuid.uuid4(),
            worker_id=w.id,
            constraint_type=ConstraintType.VACATION,
            start_date=vac_start,
            end_date=vac_end,
            priority=1,
            enabled=True,
        )
        db.add(c)

    # No-weekends for 2 workers
    for w in emp_workers[5:7]:
        c = WorkerConstraint(
            id=uuid.uuid4(),
            worker_id=w.id,
            constraint_type=ConstraintType.NO_WEEKENDS,
            start_date=today,
            end_date=today + timedelta(days=180),
            priority=2,
            enabled=True,
        )
        db.add(c)

    db.commit()
    print("=== DATABASE SEED COMPLETE ===")
    print(f"  Users: {db.query(User).count()}")
    print(f"  Workers: {db.query(Worker).count()}")
    print(f"  Departments: {db.query(Department).count()}")
    print(f"  Skills: {db.query(Skill).count()}")
    print(f"  Shift Types: {db.query(ShiftType).count()}")
    print(f"  Schedules: {db.query(Schedule).count()}")
    print(f"  Constraints: {db.query(WorkerConstraint).count()}")

except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
'''

def main():
    print("=" * 70)
    print(" DATABASE RESET & SEED SCRIPT")
    print("=" * 70)

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PASS, timeout=10)

    # 1. Upload the seed script into the backend container
    print("\n[1/4] Uploading seed script to server...")
    sftp = c.open_sftp()
    with sftp.file("/home/ad/app/seed_db.py", "w") as f:
        f.write(SEED_SCRIPT)
    sftp.close()
    print("  ✓ seed_db.py uploaded")

    # 2. Copy seed script into backend container
    print("\n[2/4] Copying seed script into backend container...")
    out = ssh_exec(c, f"echo '{PASS}' | sudo -S docker cp /home/ad/app/seed_db.py scheduler_backend:/app/seed_db.py", timeout=15)
    print(f"  {out.strip()}")

    # 3. Execute the seed script inside the container
    print("\n[3/4] Executing database reset & seed inside backend container...")
    out = ssh_exec(c,
        f"echo '{PASS}' | sudo -S docker exec scheduler_backend python /app/seed_db.py",
        timeout=60
    )
    print(out)

    # 4. Restart backend to pick up clean state
    print("\n[4/4] Restarting backend container...")
    out = ssh_exec(c,
        f"echo '{PASS}' | sudo -S docker restart scheduler_backend",
        timeout=30
    )
    print(f"  {out.strip()}")

    time.sleep(5)

    # Verify health
    _, o, _ = c.exec_command('curl -s http://localhost:8000/health 2>&1')
    print(f"\n=== HEALTH CHECK ===\n{o.read().decode()}")

    # Verify login
    _, o, _ = c.exec_command(
        "curl -s -X POST http://localhost:8000/api/v1/auth/login "
        "-H 'Content-Type: application/json' "
        "-d '{\"email\":\"admin@admin.com\",\"password\":\"!23QWEasd\"}' 2>&1"
    )
    print(f"=== LOGIN TEST ===\n{o.read().decode()}")

    c.close()
    print("\n" + "=" * 70)
    print(" DONE — Database reset and seeded successfully")
    print("=" * 70)

if __name__ == "__main__":
    main()
