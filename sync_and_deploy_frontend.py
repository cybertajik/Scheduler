import os
import sys
import paramiko

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

local_frontend = r"C:\Users\AD\Desktop\Scheduler\frontend"
remote_frontend = "/home/ad/app/frontend"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def upload_dir(sftp, local, remote):
    skip_folders = {'.git', 'node_modules', '__pycache__', '.venv', 'dist'}
    for root, dirs, files in os.walk(local):
        dirs[:] = [d for d in dirs if d not in skip_folders]
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
            print(f"Uploading {file} -> {remote_file}")
            sftp.put(local_file, remote_file)

try:
    print("Connecting to remote server...")
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    sftp = client.open_sftp()
    
    print("Syncing frontend files...")
    upload_dir(sftp, local_frontend, remote_frontend)
    sftp.close()

    print("Rebuilding frontend docker container...")
    cmd = "rm -rf /home/ad/app/frontend/node_modules && cd /home/ad/app && echo '!23QWEasd' | sudo -S docker compose build frontend && echo '!23QWEasd' | sudo -S docker compose up -d frontend"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))

    print("Verifying frontend container status...")
    stdin, stdout, stderr = client.exec_command("echo '!23QWEasd' | sudo -S docker ps --filter name=frontend")
    print(stdout.read().decode('utf-8'))

finally:
    client.close()
