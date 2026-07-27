import paramiko, re, time

def strip_ansi(t):
    t = re.sub(r'\x1b\[[0-9;?]*[mGKHFJA]', '', t)
    t = re.sub(r'[\r\x07]', '', t)
    return t

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.0.5', username='ad', password='!23QWEasd', timeout=10)

print("=== Deploying fix: rebuild backend image (cached pip, fresh code) ===")

# Use a channel with PTY to handle sudo
transport = c.get_transport()
chan = transport.open_session()
chan.get_pty()
chan.set_combine_stderr(True)

# Build only the code COPY layer (pip layer is cached), then restart
cmd = (
    "echo '!23QWEasd' | sudo -S bash -c '"
    "cd /home/ad/app && "
    "docker compose build backend celery_worker && "
    "docker compose up -d --no-deps backend celery_worker"
    "'"
)
chan.exec_command(cmd)

output = b""
deadline = time.time() + 180
while not chan.exit_status_ready():
    if time.time() > deadline:
        print("[TIMEOUT]")
        break
    if chan.recv_ready():
        chunk = chan.recv(4096)
        output += chunk

while chan.recv_ready():
    output += chan.recv(4096)
chan.close()
print(strip_ansi(output.decode('utf-8', errors='replace')))

time.sleep(6)

# Check status and logs
_, o, _ = c.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}"')
print('\n=== CONTAINERS ===')
print(o.read().decode('utf-8', errors='replace'))

_, o, _ = c.exec_command('docker logs scheduler_backend --tail 30 2>&1')
print('=== BACKEND LOGS ===')
print(o.read().decode('utf-8', errors='replace'))

_, o, _ = c.exec_command('curl -s http://localhost:8000/health 2>&1')
print('=== HEALTH CHECK ===')
print(o.read().decode('utf-8', errors='replace'))

_, o, _ = c.exec_command(
    "curl -s -X POST http://localhost:8000/api/v1/auth/login "
    "-H 'Content-Type: application/json' "
    "-d '{\"email\":\"admin@admin.com\",\"password\":\"!23QWEasd\"}' 2>&1"
)
print('=== LOGIN TEST ===')
print(o.read().decode('utf-8', errors='replace'))

c.close()
print('\nDone.')
