import http.client
import json

API_KEY = ""
URL = ""

conn = http.client.HTTPSConnection(URL)


programm = """
a, b = int(input()), int(input())
print(a + b)
"""

input = "2\n4"

command = "python main.py"
file_name = "main.py"
API_KEY = ""


data = {
    "command": command,
    "files": [
        {
            "name": file_name,
            "content": programm
        }
    ],
    "stdin": input
}

payload = json.dumps(data, indent=2, ensure_ascii=False)

headers = {
    'Content-Type': "application/json",
    'Authorization': API_KEY
}

conn.request("POST", "/", payload.encode(), headers)

res = conn.getresponse()
data = res.read()

decoded_data = json.loads(data.decode("utf-8"))
    

print(json.dumps(decoded_data, indent=4, ensure_ascii=False))