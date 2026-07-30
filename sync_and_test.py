import os
import sys
import paramiko

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

local_backend = r"C:\Users\AD\Desktop\Scheduler\backend"
remote_backend = "/home/ad/app/backend"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def upload_dir(sftp, local, remote):
    for root, dirs, files in os.walk(local):
        dirs[:] = [d for d in dirs if d not in ('.venv', '__pycache__', '.pytest_cache')]
        rel_path = os.path.relpath(root, local)
        if rel_path == ".":
            remote_dir = remote
        else:
            remote_dir = os.path.join(remote, rel_path).replace("\\", "/")
        try:
            sftp.mkdir(remote_dir)
        except IOError:
            pass
        for file in files:
            local_file = os.path.join(root, file)
            remote_file = os.path.join(remote_dir, file).replace("\\", "/")
            print(f"  Uploading {file} -> {remote_file}")
            sftp.put(local_file, remote_file)

def run_cmd(client, cmd, timeout=300):
    """Run a command with sudo via PTY, returning combined output."""
    chan = client.get_transport().open_session()
    chan.get_pty()
    chan.set_combine_stderr(True)
    full_cmd = f"echo '{password}' | sudo -S bash -c \"{cmd}\""
    chan.exec_command(full_cmd)
    output = b""
    import time
    deadline = time.time() + timeout
    while not chan.exit_status_ready():
        if time.time() > deadline:
            print("  [TIMEOUT]")
            break
        if chan.recv_ready():
            chunk = chan.recv(8192)
            output += chunk
    while chan.recv_ready():
        output += chan.recv(8192)
    chan.close()
    return output.decode('utf-8', errors='replace')

def safe_print(text):
    """Print filtering out non-printable ANSI escape sequences for Windows console."""
    import re
    clean = re.sub(r'\x1b\[[0-9;]*[mGKHF]', '', text)
    clean = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', clean)
    print(clean)

try:
    print("Connecting to remote server...")
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    sftp = client.open_sftp()

    print("Syncing backend files...")
    upload_dir(sftp, local_backend, remote_backend)

    local_scripts = r"C:\Users\AD\Desktop\Scheduler\scripts"
    remote_scripts = "/home/ad/app/scripts"
    print("Syncing scripts files...")
    upload_dir(sftp, local_scripts, remote_scripts)

    sftp.close()
    print("Upload complete.")

    print("\nRebuilding backend (--no-cache) to pick up new requirements (openpyxl)...")
    out = run_cmd(client,
        "cd /home/ad/app && docker compose build --no-cache backend celery_worker && docker compose up -d",
        timeout=300)
    safe_print(out)

    print("\n=== BACKEND LOGS (last 50 lines) ===")
    out = run_cmd(client, "docker logs scheduler_backend --tail 50 2>&1", timeout=30)
    safe_print(out)

    print("\n=== RUNNING PYTEST ===")
    out = run_cmd(client, "docker exec scheduler_backend pytest /app/tests/ -v 2>&1", timeout=180)
    safe_print(out)

    print("\n=== BACKUP HEALTH CHECK ===")
    stdin, stdout, stderr = client.exec_command(
        "cd /home/ad/app && chmod +x scripts/*.sh && ./scripts/backup_all.sh 2>&1")
    safe_print(stdout.read().decode('utf-8', errors='replace'))

finally:
    client.close()
    print("\nDone.")
