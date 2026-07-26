import paramiko

hostname = '192.168.0.5'
username = 'ad'
password = '!23QWEasd'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=10)
    
    stdin, stdout, stderr = client.exec_command("find /home/ad -maxdepth 3 -name 'docker-compose.yml'")
    print("=== DOCKER COMPOSE LOCATIONS ===")
    print(stdout.read().decode('utf-8'))

    stdin, stdout, stderr = client.exec_command("pwd; ls -la")
    print("=== HOME DIR ===")
    print(stdout.read().decode('utf-8'))

finally:
    client.close()
