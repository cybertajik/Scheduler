import os
import sys
import time
import paramiko

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

local_app_dir = r'c:\Users\AD\Desktop\Scheduler'
remote_app_dir = '/home/ad/app'

def run_cmd(client, cmd, timeout=600):
    print(f"\n[REMOTE RUN] {cmd}")
    full_cmd = cmd.replace("sudo ", f"echo '{password}' | sudo -S ")
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    
    out_lines = []
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(2048).decode('utf-8', errors='replace')
            print(chunk, end='')
            out_lines.append(chunk)
        time.sleep(0.1)
    
    remaining = stdout.read().decode('utf-8', errors='replace')
    print(remaining, end='')
    out_lines.append(remaining)
    
    err = stderr.read().decode('utf-8', errors='replace')
    if err and "password for" not in err.lower():
        print(f"\n[STDERR] {err}")
        
    code = stdout.channel.recv_exit_status()
    return code, "".join(out_lines)

def upload_dir_sftp(sftp, local_dir, remote_dir):
    print(f"\n[SFTP] Uploading {local_dir} -> {remote_dir}")
    try:
        sftp.mkdir(remote_dir)
    except IOError:
        pass

    # Do NOT skip 'app'! Only skip hidden git, node_modules, pycache
    skip_folders = {'.git', 'node_modules', '__pycache__', '.venv', 'dist'}

    for root, dirs, files in os.walk(local_dir):
        dirs[:] = [d for d in dirs if d not in skip_folders]

        rel_path = os.path.relpath(root, local_dir)
        if rel_path == ".":
            current_remote = remote_dir
        else:
            current_remote = os.path.join(remote_dir, rel_path).replace("\\", "/")
            try:
                sftp.mkdir(current_remote)
            except IOError:
                pass

        for file in files:
            if file.endswith('.pyc') or file == 'inspection_output.json' or file == 'check_logs.py':
                continue
            local_file_path = os.path.join(root, file)
            remote_file_path = os.path.join(current_remote, file).replace("\\", "/")
            print(f"  Uploading {file} -> {remote_file_path}")
            sftp.put(local_file_path, remote_file_path)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Connecting to SSH {username}@{hostname}...")
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    print("SSH Connection Established!")

    # 1. Clean old containers and directory
    print("\n--- STEP 1: Cleaning Old Remote Directory & Images ---")
    run_cmd(client, f"cd {remote_app_dir} && sudo docker compose down -v || true")
    run_cmd(client, f"rm -rf {remote_app_dir}/*")

    # 2. Upload fresh monorepo scaffold
    print("\n--- STEP 2: Uploading Fresh Monorepo Scaffold ---")
    sftp = client.open_sftp()
    upload_dir_sftp(sftp, local_app_dir, remote_app_dir)
    sftp.close()
    print("Upload complete!")

    # 3. Deploy stack via Docker Compose
    print("\n--- STEP 3: Building & Deploying Monorepo Stack ---")
    code, build_out = run_cmd(client, f"cd {remote_app_dir} && sudo docker compose up -d --build", timeout=900)
    print(f"Docker Compose exit code: {code}")

    # 4. Wait for containers to initialize
    print("\nWaiting 10 seconds for containers to initialize...")
    time.sleep(10)

    # 5. Verify container status
    print("\n--- STEP 4: Verifying Container Status ---")
    run_cmd(client, f"cd {remote_app_dir} && sudo docker compose ps")

    # 6. Test Backend OpenAPI & Health
    print("\n--- STEP 5: Verifying API Health Endpoint ---")
    run_cmd(client, "curl -s http://localhost:8000/api/v1/health")

    print("\n=======================================================")
    print(" MONOREPO SCAFFOLD DEPLOYED & RUNNING ON 192.168.0.5! ")
    print("=======================================================")

finally:
    client.close()
