import sys
import paramiko

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.5', username='ad', password='!23QWEasd')

_, o, _ = c.exec_command(
    'curl -s -X POST http://localhost:8000/api/v1/auth/login '
    '-H "Content-Type: application/x-www-form-urlencoded" '
    '-d "username=admin%40admin.com&password=%2123QWEasd"'
)
print("=== LOGIN TEST ===")
result = o.read().decode()
print(result)

if "access_token" in result:
    print("\n✅ Login successful!")
else:
    print("\n❌ Login failed")

# Also check worker count
_, o, _ = c.exec_command(
    'docker exec scheduler_backend python -c "'
    'from app.core.database import SessionLocal; '
    'from app.models.user import User; '
    'from app.models.worker import Worker; '
    'db = SessionLocal(); '
    'print(f\"Users: {db.query(User).count()}\"); '
    'print(f\"Workers: {db.query(Worker).count()}\"); '
    'db.close()"'
)
print("\n=== DB COUNTS ===")
print(o.read().decode())

c.close()
