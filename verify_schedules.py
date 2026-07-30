import urllib.request
import urllib.parse
import json

# Login
login_data = urllib.parse.urlencode({
    'username': 'admin@admin.com',
    'password': '!23QWEasd'
}).encode('utf-8')
req = urllib.request.Request('http://192.168.0.5/api/v1/auth/login', data=login_data, method='POST')
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())['access_token']

# Get schedules
req2 = urllib.request.Request('http://192.168.0.5/api/v1/schedules')
req2.add_header('Authorization', f'Bearer {token}')
with urllib.request.urlopen(req2) as resp:
    data = json.loads(resp.read())

print(f'Total schedules: {len(data)}')
for d in data:
    print(f"  {d['month']}/{d['year']} - {d['status']}")
