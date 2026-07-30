import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.5', username='ad', password='!23QWEasd', timeout=10)

# Test login with proper form encoding
_, o, _ = c.exec_command(
    "curl -s -X POST http://localhost:8000/api/v1/auth/login "
    "-H 'Content-Type: application/x-www-form-urlencoded' "
    "--data-urlencode 'username=admin@admin.com' "
    "--data-urlencode 'password=!23QWEasd' 2>&1"
)
print('=== LOGIN TEST ===')
print(o.read().decode('utf-8', errors='replace'))

# Test health live endpoint
_, o, _ = c.exec_command('curl -s http://localhost:8000/api/v1/health/live 2>&1')
print('=== HEALTH LIVE ===')
print(o.read().decode('utf-8', errors='replace'))

# Test docs endpoint
_, o, _ = c.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>&1')
print('=== DOCS STATUS ===', o.read().decode('utf-8', errors='replace'))

c.close()
print('Done.')
