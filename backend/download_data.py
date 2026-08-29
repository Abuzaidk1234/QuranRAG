import urllib.request
import json
import os

DATA_DIR = "data"
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Datasets to download
QURAN_ENG_URL = "https://api.alquran.cloud/v1/quran/en.sahih"
QURAN_ARA_URL = "https://api.alquran.cloud/v1/quran/quran-uthmani"

# AhmedBaset unified Hadith Datasets (Arabic + English + Chapters + Grades)
AHMED_BASET_BASE = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_book/the_9_books"

HADITH_URLS = {
    "bukhari": f"{AHMED_BASET_BASE}/bukhari.json",
    "muslim": f"{AHMED_BASET_BASE}/muslim.json",
    "abudawud": f"{AHMED_BASET_BASE}/abudawud.json",
    "tirmidhi": f"{AHMED_BASET_BASE}/tirmidhi.json",
    "nasai": f"{AHMED_BASET_BASE}/nasai.json",
    "ibnmajah": f"{AHMED_BASET_BASE}/ibnmajah.json"
}

def download_json(url, filename):
    filepath = os.path.join(DATA_DIR, filename)
    print(f"Downloading {url} to {filepath}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Successfully saved {filename}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    download_json(QURAN_ENG_URL, "quran_eng.json")
    download_json(QURAN_ARA_URL, "quran_ara.json")
    
    for book, url in HADITH_URLS.items():
        download_json(url, f"hadith_{book}.json")
