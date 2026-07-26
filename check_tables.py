import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('192.168.0.5', username='ad', password='!23QWEasd')

cmd = 'echo "!23QWEasd" | sudo -S docker exec scheduler_postgres psql -U scheduler_user -d scheduler_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' ORDER BY table_name;"'
stdin, stdout, stderr = client.exec_command(cmd)
print("--- STDOUT ---")
print(stdout.read().decode())
print("--- STDERR ---")
print(stderr.read().decode())
client.close()
