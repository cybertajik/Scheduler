import os
import paramiko

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

local_backend = r"C:\Users\AD\Desktop\Scheduler\backend"
remote_backend = "/home/ad/app/backend"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def upload_dir(sftp, local, remote):
    for root, dirs, files in os.walk(local):
        rel_path = os.path.relpath(root, local)
        if rel_path == ".":
            remote_dir = remote
        else:
            remote_dir = os.path.join(remote, rel_path).replace("\\", "/")

        try:
            sftp.mkdir(remote_dir)
        except IOError:
            pass # directory already exists

        for file in files:
            local_file = os.path.join(root, file)
            remote_file = os.path.join(remote_dir, file).replace("\\", "/")
            print(f"Uploading {file} -> {remote_file}")
            sftp.put(local_file, remote_file)

try:
    print("Connecting to remote server...")
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    sftp = client.open_sftp()
    
    print("Syncing backend files...")
    upload_dir(sftp, local_backend, remote_backend)
    sftp.close()

    print("Rebuilding docker containers...")
    cmd = "cd /home/ad/app && echo '!23QWEasd' | sudo -S docker compose build backend celery_worker && echo '!23QWEasd' | sudo -S docker compose up -d backend celery_worker"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))

    print("Running pytest on remote container...")
    stdin, stdout, stderr = client.exec_command("echo '!23QWEasd' | sudo -S docker exec scheduler_backend pytest /app/tests/")
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print("=== PYTEST OUTPUT ===")
    print(out)
    print(err)

finally:
    client.close()
