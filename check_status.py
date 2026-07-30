import paramiko, re, sys

def strip_ansi(t):
    return re.sub(r'\x1b\[[0-9;]*[mGKHF]', '', t)

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.5', username='ad', password='!23QWEasd', timeout=10)

# Container status
_, o, e = c.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}"')
print('=== CONTAINERS ===')
print(strip_ansi(o.read().decode('utf-8', errors='replace')))

# Backend logs
_, o, e = c.exec_command('docker logs scheduler_backend --tail 80 2>&1')
print('=== BACKEND LOGS ===')
print(strip_ansi(o.read().decode('utf-8', errors='replace')))

# Quick health check
_, o, e = c.exec_command('curl -s http://localhost:8000/health 2>&1')
print('=== HEALTH CHECK ===')
print(strip_ansi(o.read().decode('utf-8', errors='replace')))

# Test login endpoint
_, o, e = c.exec_command(
    'curl -s -X POST http://localhost:8000/api/v1/auth/login '
    '-H "Content-Type: application/json" '
    '-d \'{"email":"admin@admin.com","password":"!23QWEasd"}\' 2>&1'
)
print('=== LOGIN TEST ===')
print(strip_ansi(o.read().decode('utf-8', errors='replace')))

c.close()
print('Done.')
