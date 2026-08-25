import requests
import json
import time

url = "https://quranrag.onrender.com/chat"

payload = {
  "query": "What is zakat?",
  "provider": "groq",
  "filter": "quran",
  "language": "en",
  "history": []
}

try:
    print("Sending request...")
    start = time.time()
    response = requests.post(url, json=payload, timeout=20)
    print("STATUS:", response.status_code)
    print("TEXT:", response.text)
    print(f"Time taken: {time.time() - start:.2f}s")
except Exception as e:
    print("Error:", e)
