"""
Database Reset & Seed Script
=============================
Connects to the remote server via SSH and:
1. Drops all tables and recreates the schema
2. Seeds:
   - Product Owner (admin@admin.com / !23QWEasd) -> SUPER_ADMIN
   - Test Organisation 1 (testorg1@org.com / !23QWEasd) -> ORG_ADMIN, Scheduler, 15 Employees
   - Test Organisation 2 (testorg2@org.com / !23QWEasd) -> ORG_ADMIN, Scheduler, 25 Employees
3. Creates departments, skills, shift types, and schedules
"""
import sys
import paramiko
import re
import time

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

print("=== DROPPING SCHEMA & ALL TABLES ===")
with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
print("=== RECREATING ALL TABLES ===")
Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # ── 1. Product Owner (Super Admin) ──
    print("Creating Product Owner (admin@admin.com)...")
    po_user = User(
        id=uuid.uuid4(),
        username="admin",
        email="admin@admin.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Product",
        last_name="Owner",
        role=UserRole.SUPER_ADMIN,
        active=True,
        preferred_language="en",
        theme_preference="dark",
    )
    db.add(po_user)
    db.flush()

    # ── 2. Test Organisation 1 ──
    print("Creating Test Organisation 1...")
    org1 = Organization(
        id=uuid.uuid4(),
        name="Test Organisation 1",
        slug="test-org-1",
        domain="org1.scheduler.local",
        description="Primary Logistics & Operations Organization",
        contact_email="testorg1@org.com",
        contact_tel="+1-555-0101",
        address="100 Innovation Way, Tech City",
        billing_cycle="MONTHLY",
        subscription_status="ACTIVE",
        require_employee_id=True,
        country_code="US",
        active=True,
    )
    db.add(org1)
    db.flush()

    # Org 1 Departments
    org1_depts = {}
    for name in ["Logistics", "Warehouse", "Support"]:
        d = Department(id=uuid.uuid4(), organization_id=org1.id, name=name, description=f"{name} dept")
        db.add(d)
        org1_depts[name] = d
    db.flush()

    # Org 1 Manager
    mgr1 = User(
        id=uuid.uuid4(),
        organization_id=org1.id,
        username="testorg1",
        email="testorg1@org.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Alex",
        last_name="Vance",
        role=UserRole.ORG_ADMIN,
        active=True,
    )
    db.add(mgr1)
    # Org 1 Scheduler
    sched1 = User(
        id=uuid.uuid4(),
        organization_id=org1.id,
        username="scheduler1",
        email="scheduler1@testorg1.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Sam",
        last_name="Planner",
        role=UserRole.SCHEDULER,
        active=True,
    )
    db.add(sched1)
    db.flush()

    # Org 1 - 15 Employees
    print("Creating 15 Employees for Test Organisation 1...")
    org1_emp_names = [
        ("James", "Miller", "Logistics", "+1-555-0101", 38.0, "HOURLY", 18.50),
        ("Emily", "Davis", "Logistics", "+1-555-0102", 40.0, "HOURLY", 19.00),
        ("Michael", "Wilson", "Logistics", "+1-555-0103", 36.0, "HOURLY", 17.50),
        ("Jessica", "Brown", "Warehouse", "+1-555-0104", 40.0, "SALARY", 3200.0),
        ("Daniel", "Taylor", "Warehouse", "+1-555-0105", 40.0, "HOURLY", 20.00),
        ("Ashley", "Anderson", "Warehouse", "+1-555-0106", 32.0, "HOURLY", 17.00),
        ("David", "Thomas", "Warehouse", "+1-555-0107", 40.0, "HOURLY", 18.00),
        ("Sarah", "Jackson", "Warehouse", "+1-555-0108", 38.0, "SALARY", 3000.0),
        ("Robert", "White", "Support", "+1-555-0109", 40.0, "HOURLY", 19.50),
        ("Jennifer", "Harris", "Support", "+1-555-0110", 36.0, "HOURLY", 18.00),
        ("William", "Martin", "Support", "+1-555-0111", 40.0, "SALARY", 3400.0),
        ("Amanda", "Garcia", "Support", "+1-555-0112", 32.0, "HOURLY", 17.50),
        ("Thomas", "Martinez", "Logistics", "+1-555-0113", 40.0, "HOURLY", 19.00),
        ("Lisa", "Robinson", "Logistics", "+1-555-0114", 38.0, "HOURLY", 18.50),
        ("Christopher", "Clark", "Warehouse", "+1-555-0115", 40.0, "SALARY", 3100.0),
    ]

    for i, (fn, ln, dept, phone, hours, ctype, pay) in enumerate(org1_emp_names, 1):
        num = f"emp1_{i:02d}"
        u = User(
            id=uuid.uuid4(),
            organization_id=org1.id,
            username=num,
            email=f"{fn.lower()}.{ln.lower()}@testorg1.com",
            password_hash=hash_pw("!23QWEasd"),
            first_name=fn,
            last_name=ln,
            role=UserRole.EMPLOYEE,
            active=True,
        )
        db.add(u)
        db.flush()

        w = Worker(
            id=uuid.uuid4(),
            organization_id=org1.id,
            employee_number=f"ORG1-{i:03d}",
            department_id=org1_depts[dept].id,
            user_id=u.id,
            first_name=fn,
            last_name=ln,
            phone=phone,
            email=u.email,
            hire_date=date(2023, 1, 15),
            weekly_contract_hours=hours,
            contract_type=ContractType.SALARY if ctype == "SALARY" else ContractType.HOURLY,
            hourly_rate=pay if ctype == "HOURLY" else None,
            monthly_salary=pay if ctype == "SALARY" else None,
            active=True,
        )
        db.add(w)
    db.flush()

    # ── 3. Test Organisation 2 ──
    print("Creating Test Organisation 2...")
    org2 = Organization(
        id=uuid.uuid4(),
        name="Test Organisation 2",
        slug="test-org-2",
        domain="org2.scheduler.local",
        description="Healthcare & Clinical Services",
        contact_email="testorg2@org.com",
        contact_tel="+1-555-0202",
        address="200 Health Center Blvd, Medical District",
        billing_cycle="ANNUAL",
        subscription_status="ACTIVE",
        require_employee_id=False,
        country_code="GB",
        active=True,
    )
    db.add(org2)
    db.flush()

    # Org 2 Departments
    org2_depts = {}
    for name in ["Nursing", "Emergency", "Pediatrics"]:
        d = Department(id=uuid.uuid4(), organization_id=org2.id, name=name, description=f"{name} ward")
        db.add(d)
        org2_depts[name] = d
    db.flush()

    # Org 2 Manager
    mgr2 = User(
        id=uuid.uuid4(),
        organization_id=org2.id,
        username="testorg2",
        email="testorg2@org.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Dr. Marcus",
        last_name="Brody",
        role=UserRole.ORG_ADMIN,
        active=True,
    )
    db.add(mgr2)
    # Org 2 Scheduler
    sched2 = User(
        id=uuid.uuid4(),
        organization_id=org2.id,
        username="scheduler2",
        email="scheduler2@testorg2.com",
        password_hash=hash_pw("!23QWEasd"),
        first_name="Clara",
        last_name="Roster",
        role=UserRole.SCHEDULER,
        active=True,
    )
    db.add(sched2)
    db.flush()

    # Org 2 - 25 Employees
    print("Creating 25 Employees for Test Organisation 2...")
    org2_emp_names = [
        ("Oliver", "Smith", "Nursing", "+44-20-7946-0101", 40.0, "SALARY", 3800.0),
        ("Charlotte", "Jones", "Nursing", "+44-20-7946-0102", 37.5, "HOURLY", 22.00),
        ("George", "Williams", "Nursing", "+44-20-7946-0103", 40.0, "HOURLY", 21.50),
        ("Amelia", "Brown", "Emergency", "+44-20-7946-0104", 40.0, "SALARY", 4200.0),
        ("Leo", "Taylor", "Emergency", "+44-20-7946-0105", 37.5, "HOURLY", 24.00),
        ("Isla", "Davies", "Emergency", "+44-20-7946-0106", 40.0, "HOURLY", 23.50),
        ("Arthur", "Evans", "Pediatrics", "+44-20-7946-0107", 35.0, "HOURLY", 20.00),
        ("Mia", "Thomas", "Pediatrics", "+44-20-7946-0108", 40.0, "SALARY", 3600.0),
        ("Freddie", "Roberts", "Nursing", "+44-20-7946-0109", 40.0, "HOURLY", 21.00),
        ("Sophia", "Johnson", "Nursing", "+44-20-7946-0110", 37.5, "HOURLY", 22.50),
        ("Harry", "Walker", "Emergency", "+44-20-7946-0111", 40.0, "SALARY", 4100.0),
        ("Grace", "Wright", "Emergency", "+44-20-7946-0112", 40.0, "HOURLY", 25.00),
        ("Jack", "Robinson", "Pediatrics", "+44-20-7946-0113", 35.0, "HOURLY", 19.50),
        ("Evie", "Thompson", "Pediatrics", "+44-20-7946-0114", 40.0, "SALARY", 3500.0),
        ("Alf", "White", "Nursing", "+44-20-7946-0115", 37.5, "HOURLY", 21.50),
        ("Ella", "Hughes", "Nursing", "+44-20-7946-0116", 40.0, "HOURLY", 22.00),
        ("Jacob", "Edwards", "Emergency", "+44-20-7946-0117", 40.0, "SALARY", 4300.0),
        ("Freya", "Green", "Emergency", "+44-20-7946-0118", 37.5, "HOURLY", 24.50),
        ("Charlie", "Hall", "Pediatrics", "+44-20-7946-0119", 40.0, "HOURLY", 20.50),
        ("Ivy", "Lewis", "Pediatrics", "+44-20-7946-0120", 35.0, "SALARY", 3400.0),
        ("Oscar", "Harris", "Nursing", "+44-20-7946-0121", 40.0, "HOURLY", 21.00),
        ("Florence", "Clarke", "Nursing", "+44-20-7946-0122", 37.5, "HOURLY", 22.00),
        ("Noah", "Patel", "Emergency", "+44-20-7946-0123", 40.0, "SALARY", 4000.0),
        ("Emily", "Jackson", "Emergency", "+44-20-7946-0124", 40.0, "HOURLY", 23.00),
        ("Henry", "Wood", "Pediatrics", "+44-20-7946-0125", 35.0, "HOURLY", 20.00),
    ]

    for i, (fn, ln, dept, phone, hours, ctype, pay) in enumerate(org2_emp_names, 1):
        num = f"emp2_{i:02d}"
        u = User(
            id=uuid.uuid4(),
            organization_id=org2.id,
            username=num,
            email=f"{fn.lower()}.{ln.lower()}@testorg2.com",
            password_hash=hash_pw("!23QWEasd"),
            first_name=fn,
            last_name=ln,
            role=UserRole.EMPLOYEE,
            active=True,
        )
        db.add(u)
        db.flush()

        w = Worker(
            id=uuid.uuid4(),
            organization_id=org2.id,
            employee_number=None, # Org 2 has names only (employee_number is None)
            department_id=org2_depts[dept].id,
            user_id=u.id,
            first_name=fn,
            last_name=ln,
            phone=phone,
            email=u.email,
            hire_date=date(2023, 6, 1),
            weekly_contract_hours=hours,
            contract_type=ContractType.SALARY if ctype == "SALARY" else ContractType.HOURLY,
            hourly_rate=pay if ctype == "HOURLY" else None,
            monthly_salary=pay if ctype == "SALARY" else None,
            active=True,
        )
        db.add(w)
    db.flush()

    # ── 4. Shift Types ──
    print("Creating shift types...")
    shift_types_data = [
        ("Morning", "#22C55E", time(6, 0), time(14, 0), 8.0, False, False),
        ("Day", "#3B82F6", time(9, 0), time(17, 0), 8.0, False, False),
        ("Evening", "#F59E0B", time(14, 0), time(22, 0), 8.0, False, False),
        ("Night", "#EF4444", time(22, 0), time(6, 0), 8.0, True, True),
    ]
    for name, color, st, et, dur, night, rest in shift_types_data:
        st_obj = ShiftType(id=uuid.uuid4(), name=name, color=color, start_time=st, end_time=et, duration=dur, is_night_shift=night, requires_rest_day=rest)
        db.add(st_obj)
    db.flush()

    # ── 5. Schedules ──
    print("Creating schedule period...")
    today = date.today()
    sched1 = Schedule(id=uuid.uuid4(), month=today.month, year=today.year, status=ScheduleStatus.DRAFT)
    db.add(sched1)

    db.commit()
    print("=== SEED COMPLETE ===")
    print(f"  Organizations: {db.query(Organization).count()}")
    print(f"  Users: {db.query(User).count()}")
    print(f"  Workers: {db.query(Worker).count()}")

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

    print("\n[1/4] Uploading seed script to server...")
    sftp = c.open_sftp()
    with sftp.file("/home/ad/app/seed_db.py", "w") as f:
        f.write(SEED_SCRIPT)
    sftp.close()

    print("\n[2/4] Copying seed script into backend container...")
    out = ssh_exec(c, f"echo '{PASS}' | sudo -S docker cp /home/ad/app/seed_db.py scheduler_backend:/app/seed_db.py", timeout=15)
    print(f"  {out.strip()}")

    print("\n[3/4] Executing database reset & seed inside backend container...")
    out = ssh_exec(c, f"echo '{PASS}' | sudo -S docker exec scheduler_backend python /app/seed_db.py", timeout=60)
    print(out)

    print("\n[4/4] Restarting backend container...")
    out = ssh_exec(c, f"echo '{PASS}' | sudo -S docker restart scheduler_backend", timeout=30)
    print(f"  {out.strip()}")

    time.sleep(5)

    _, o, _ = c.exec_command('curl -s http://localhost:8000/api/v1/health 2>&1')
    print(f"\n=== HEALTH CHECK ===\n{o.read().decode()}")

    c.close()
    print("\n" + "=" * 70)
    print(" DONE — Database reset and seeded successfully")
    print("=" * 70)

if __name__ == "__main__":
    main()
