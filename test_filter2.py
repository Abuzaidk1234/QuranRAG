import requests
import json

url = "https://quranrag.onrender.com/chat"

payload = {
  "query": "What is zakat?",
  "provider": "groq",
  "filter": "quran",
  "language": "en",
  "history": []
}

try:
    response = requests.post(url, json=payload)
    print("STATUS:", response.status_code)
    print("TEXT:", response.text)
except Exception as e:
    print("Error:", e)
