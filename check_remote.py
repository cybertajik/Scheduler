import paramiko
import sys

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    
    # 1. Check running docker containers
    stdin, stdout, stderr = client.exec_command("echo '!23QWEasd' | sudo -S docker ps")
    out = stdout.read().decode('utf-8', errors='replace')
    print("=== DOCKER CONTAINERS ===")
    print(out)

    # 2. Sync files or run pytest if scheduler_backend container is running
    stdin, stdout, stderr = client.exec_command("echo '!23QWEasd' | sudo -S docker exec scheduler_backend pytest /app/tests/")
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print("=== PYTEST OUTPUT ===")
    print(out)
    print(err)

finally:
    client.close()
