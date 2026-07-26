import paramiko
import json

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

def run_remote_cmd(client, cmd, timeout=5):
    try:
        # If sudo is needed, pipe password via sudo -S
        full_cmd = cmd.replace("sudo ", f"echo '{password}' | sudo -S ")
        stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        exit_code = stdout.channel.recv_exit_status()
        return exit_code, out, err
    except Exception as e:
        return -1, "", str(e)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    
    checks = {
        "os": "cat /etc/os-release",
        "uname": "uname -a",
        "docker": "docker --version",
        "docker_compose": "docker compose version",
        "postgres": "psql --version",
        "redis": "redis-cli --version",
        "nginx": "nginx -v",
        "python": "python3 --version",
        "node": "node --version",
        "listening_ports": "sudo ss -tulpn",
        "user_groups": "groups"
    }

    results = {}
    for key, cmd in checks.items():
        code, out, err = run_remote_cmd(client, cmd, timeout=5)
        results[key] = {
            "exit_code": code,
            "output": (out + "\n" + err).strip()
        }

    with open("c:\\Users\\AD\\Desktop\\Scheduler\\inspection_output.json", "w") as f:
        json.dump(results, f, indent=2)

    print("INSPECTION_COMPLETE")

finally:
    client.close()
