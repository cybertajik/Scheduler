import paramiko

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    stdin, stdout, stderr = client.exec_command(f"echo '{password}' | sudo -S docker logs scheduler_backend --tail 50")
    print("--- BACKEND LOGS ---")
    print(stdout.read().decode('utf-8', errors='replace'))
    print(stderr.read().decode('utf-8', errors='replace'))

finally:
    client.close()
