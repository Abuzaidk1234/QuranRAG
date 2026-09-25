#!/usr/bin/env python3
"""
Bayan AI - System Health & Component Diagnostic Script
Run this script anytime to check if all components are online and determine which one is causing issues.
Usage:
    python check_system.py
"""

import sys
import os
import json
import time

# Ensure output encoding handles emojis in Windows terminal
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Determine paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

try:
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH)
except ImportError:
    pass

import requests

RENDER_BASE_URL = "https://quranrag.onrender.com"
APP_SECRET = "quranrag_mobile_secret_2026"

class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    RESET = "\033[0m"

def print_header(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}===================================================={Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}===================================================={Colors.RESET}\n")

def check_result(name, passed, details="", remedy=""):
    if passed:
        print(f"  [{Colors.GREEN}ONLINE / OK{Colors.RESET}] {name}")
        if details:
            print(f"     └─ {details}")
    else:
        print(f"  [{Colors.RED}FAILED / ERROR{Colors.RESET}] {name}")
        if details:
            print(f"     └─ Details: {Colors.YELLOW}{details}{Colors.RESET}")
        if remedy:
            print(f"     └─ Fix: {Colors.BOLD}{remedy}{Colors.RESET}")
    return passed

def run_diagnostics():
    print_header("BAYAN PROJECT - FULL COMPONENT STATUS CHECK")
    results = {}

    # 1. Local Environment & Config
    print(f"{Colors.BOLD}1. Configuration & Keys (.env){Colors.RESET}")
    env_exists = os.path.exists(ENV_PATH)
    groq_key = os.getenv("GROQ_API_KEY")
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_key = os.getenv("QDRANT_API_KEY")

    has_keys = bool(groq_key and qdrant_url and qdrant_key)
    details = f"File: {ENV_PATH} | Groq: {'Present' if groq_key else 'Missing'} | Qdrant: {'Present' if qdrant_url else 'Missing'}"
    remedy = f"Make sure {ENV_PATH} exists with GROQ_API_KEY, QDRANT_URL, and QDRANT_API_KEY."
    results["env"] = check_result("Backend .env Configuration", env_exists and has_keys, details, remedy)

    # 2. Local Data Files
    print(f"\n{Colors.BOLD}2. Local Backend Scripture Data Files{Colors.RESET}")
    quran_ara = os.path.join(BACKEND_DIR, "data", "quran_ara.json")
    quran_eng = os.path.join(BACKEND_DIR, "data", "quran_eng.json")
    hadith_bukhari = os.path.join(BACKEND_DIR, "data", "hadith_bukhari.json")
    data_ok = os.path.exists(quran_ara) and os.path.exists(quran_eng) and os.path.exists(hadith_bukhari)
    details = f"Quran (Arabic/English) & Hadith (Bukhari/Muslim/etc.) verified in backend/data/" if data_ok else "Missing JSON data files in backend/data/"
    results["data"] = check_result("Local JSON Data (Quran & Hadith)", data_ok, 
                                   details,
                                   "Run backend/download_data.py to re-download Quran & Hadith JSON files.")

    # 3. Render Backend Health
    print(f"\n{Colors.BOLD}3. Render Backend API (https://quranrag.onrender.com){Colors.RESET}")
    try:
        t0 = time.time()
        r = requests.get(f"{RENDER_BASE_URL}/health", timeout=15)
        duration = round((time.time() - t0) * 1000, 1)
        passed = (r.status_code == 200 and r.json().get("status") == "ok")
        results["render_health"] = check_result(
            "Render Backend Service", 
            passed, 
            f"HTTP {r.status_code} in {duration}ms (Response: {r.text})",
            "Backend might be sleeping or deploying. Check dashboard.render.com logs."
        )
    except Exception as e:
        results["render_health"] = check_result("Render Backend Service", False, str(e), "Render instance is asleep, down, or unreachable. Check dashboard.render.com.")

    # 4. Render Quran & Hadith Endpoints
    print(f"\n{Colors.BOLD}4. Render Scripture Reader Endpoints{Colors.RESET}")
    try:
        r_quran = requests.get(f"{RENDER_BASE_URL}/quran/surahs", timeout=15)
        quran_ok = r_quran.status_code == 200 and len(r_quran.json()) > 0
        results["render_quran"] = check_result("Quran Reader API (/quran/surahs)", quran_ok, 
                                               f"HTTP {r_quran.status_code} - Loaded {len(r_quran.json()) if quran_ok else 0} surahs metadata")
    except Exception as e:
        results["render_quran"] = check_result("Quran Reader API (/quran/surahs)", False, str(e), "Check Render logs for backend/data file loading errors.")

    try:
        r_hadith = requests.get(f"{RENDER_BASE_URL}/hadiths/books", timeout=15)
        hadith_ok = r_hadith.status_code == 200 and len(r_hadith.json()) > 0
        results["render_hadith"] = check_result("Hadith Reader API (/hadiths/books)", hadith_ok, 
                                                f"HTTP {r_hadith.status_code} - Loaded {len(r_hadith.json()) if hadith_ok else 0} books metadata")
    except Exception as e:
        results["render_hadith"] = check_result("Hadith Reader API (/hadiths/books)", False, str(e), "Check Render logs for backend/data/hadith loading errors.")

    # 5. Groq AI Model
    print(f"\n{Colors.BOLD}5. Groq AI Inference Engine (LLM){Colors.RESET}")
    if groq_key:
        try:
            t0 = time.time()
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            payload = {
                "model": "qwen/qwen3.8-27b",
                "messages": [{"role": "user", "content": "Respond with the word 'OK'."}],
                "max_tokens": 5
            }
            r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=15)
            duration = round((time.time() - t0) * 1000, 1)
            if r.status_code == 200:
                answer = r.json()["choices"][0]["message"]["content"].strip()
                results["groq"] = check_result("Groq Cloud (qwen/qwen3.8-27b)", True, f"HTTP 200 in {duration}ms - Response: '{answer}'")
            else:
                results["groq"] = check_result("Groq Cloud (qwen/qwen3.8-27b)", False, f"HTTP {r.status_code}: {r.text}", 
                                               "Check if Groq API key is valid or rate limit was reached at console.groq.com.")
        except Exception as e:
            results["groq"] = check_result("Groq Cloud (qwen/qwen3.8-27b)", False, str(e), "Unable to reach api.groq.com.")
    else:
        results["groq"] = check_result("Groq Cloud", False, "GROQ_API_KEY missing in .env", "Set GROQ_API_KEY in backend/.env")

    # 6. Qdrant Cloud Vector Database
    print(f"\n{Colors.BOLD}6. Qdrant Cloud Vector Database (RAG Search){Colors.RESET}")
    if qdrant_url and qdrant_key:
        clean_url = qdrant_url.rstrip("/")
        try:
            t0 = time.time()
            headers = {"api-key": qdrant_key}
            r = requests.get(f"{clean_url}/collections", headers=headers, timeout=10)
            duration = round((time.time() - t0) * 1000, 1)
            if r.status_code == 200:
                colls = [c["name"] for c in r.json().get("result", {}).get("collections", [])]
                has_col = "quran_hadith" in colls
                results["qdrant"] = check_result("Qdrant Cloud Cluster", has_col, 
                                                 f"HTTP 200 in {duration}ms - Collections found: {colls}",
                                                 "Cluster is up, but collection 'quran_hadith' is missing. Run ingest.py to recreate.")
            else:
                results["qdrant"] = check_result("Qdrant Cloud Cluster", False, f"HTTP {r.status_code}: {r.text}",
                                                 "Log in to https://cloud.qdrant.io and verify your cluster is running and API key is valid.")
        except Exception as e:
            err_str = str(e)
            results["qdrant"] = check_result("Qdrant Cloud Cluster", False, err_str,
                                             "Connection was closed/reset. Log in to https://cloud.qdrant.io - your cluster may be suspended, paused, or restarted!")
    else:
        results["qdrant"] = check_result("Qdrant Cloud Cluster", False, "QDRANT_URL or QDRANT_API_KEY missing", "Set QDRANT_URL and QDRANT_API_KEY in backend/.env")

    # 7. End-to-End Chat API Test on Render
    print(f"\n{Colors.BOLD}7. End-to-End Live Chat Pipeline (/chat){Colors.RESET}")
    try:
        t0 = time.time()
        chat_payload = {
            "query": "What is the first surah of the Quran?",
            "provider": "groq",
            "filter": "all",
            "language": "en",
            "history": []
        }
        r_chat = requests.post(
            f"{RENDER_BASE_URL}/chat", 
            json=chat_payload, 
            headers={"x-app-secret": APP_SECRET},
            timeout=35
        )
        duration = round((time.time() - t0) * 1000, 1)
        if r_chat.status_code == 200:
            res_json = r_chat.json()
            answer = res_json.get("answer", "")[:80] + "..."
            results["chat_pipeline"] = check_result("Live RAG Chat Pipeline", True, f"HTTP 200 in {duration}ms - Answer: '{answer}'")
        else:
            remedy_msg = "If 403: secret key mismatch. If 500: see Qdrant or Groq error above."
            if "Connection reset by peer" in r_chat.text or "104" in r_chat.text:
                remedy_msg = "Error is caused by Qdrant Cloud cluster being paused/down! Wake it up in cloud.qdrant.io."
            results["chat_pipeline"] = check_result("Live RAG Chat Pipeline", False, f"HTTP {r_chat.status_code}: {r_chat.text}", remedy_msg)
    except Exception as e:
        results["chat_pipeline"] = check_result("Live RAG Chat Pipeline", False, str(e), "Render /chat request timed out or network failed.")

    # Summary
    print_header("DIAGNOSTIC SUMMARY")
    total = len(results)
    passed_count = sum(1 for v in results.values() if v)
    print(f"Components checked: {total} | Operational: {passed_count} | Issues: {total - passed_count}\n")
    if passed_count == total:
        print(f"{Colors.GREEN}{Colors.BOLD}>>> ALL SYSTEMS ARE 100% OPERATIONAL! Everything is working correctly. <<<{Colors.RESET}\n")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}>>> SOME COMPONENTS NEED ATTENTION. Review the [FAILED] items above for fixes. <<<{Colors.RESET}\n")

if __name__ == "__main__":
    run_diagnostics()
