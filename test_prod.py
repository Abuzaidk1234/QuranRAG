import requests
import json

url = "https://quranrag.onrender.com/chat"

payload = {
  "query": "And what to do when the stop fighting",
  "provider": "groq",
  "filter": "all",
  "language": "en",
  "history": [
    {
      "role": "user",
      "text": "first question"
    },
    {
      "role": "ai",
      "text": "The Quran explicitly instructs...",
      "sources": []
    }
  ]
}

try:
    response = requests.post(url, json=payload)
    print(response.status_code)
    print(response.text)
except Exception as e:
    print("Error:", e)
