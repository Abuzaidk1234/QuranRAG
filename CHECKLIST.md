# Bayan (Quran & Hadith RAG) - System Health & Diagnostic Checklist

Use this checklist and diagnostic guide to verify that all components of the Bayan ecosystem are online, healthy, and communicating properly. Whenever an issue occurs, this guide helps you instantly identify which component is down and how to fix it.

---

## ⚡ Quick 5-Second Automated Check

You can test every live component automatically by running the diagnostic script from the project root:

```powershell
python check_system.py
```
*(or `.\venv\Scripts\python.exe check_system.py`)*

This script automatically tests:
- [x] Environment variables & API keys
- [x] Local Quran & Hadith JSON databases
- [x] Render Backend `/health` endpoint & latency
- [x] Scripture Reader APIs (`/quran/surahs`, `/hadiths/books`)
- [x] Groq Cloud inference (`qwen/qwen3.8-27b`)
- [x] Qdrant Cloud Vector Database cluster & collection
- [x] End-to-end `/chat` RAG pipeline

---

## 🏗️ System Architecture Overview

```text
[ Android Mobile App ]
         │
         ▼ (HTTPS POST /chat with x-app-secret)
[ Render Backend (FastAPI) ] ◄── Keep-Alive Ping (Better Stack / UptimeRobot every 5m)
   ├── Local JSON Data (/backend/data: Quran & Hadith text)
   ├── Qdrant Cloud (Vector embeddings for semantic search)
   ├── Groq Cloud (LLaMA / Qwen 3.8 LLM response generation)
   └── Google Gemini (Fallback LLM)
```

---

## 📋 Comprehensive Component Checklist

### 1. Render Web Service (FastAPI Backend)
* **URL:** `https://quranrag.onrender.com`
* **Root Directory in Render:** `backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **Service Status** | Open `https://quranrag.onrender.com/health` in your browser | `{"status": "ok"}` (HTTP 200) |
| **Quran Reader API** | Open `https://quranrag.onrender.com/quran/surahs` | JSON list of Surahs (Al-Fatihah, etc.) |
| **Hadith Reader API** | Open `https://quranrag.onrender.com/hadiths/books` | JSON list of Hadith collections |
| **Interactive Docs** | Open `https://quranrag.onrender.com/docs` | Swagger UI showing all endpoints |

**Troubleshooting Render Issues:**
* **Takes 50+ seconds to load:** The service was asleep because the keep-alive monitor missed a ping. Once loaded, it stays awake for 15 minutes.
* **HTTP 502 / Bad Gateway:** The app crashed on boot. Check Render dashboard logs:
  - Did dependencies fail to install?
  - Is `Root Directory` set to `backend` in Render Settings?
* **HTTP 405 Method Not Allowed:** Usually caused when an uptime monitor sends an unsupported HTTP method (e.g. `HEAD`). The `/health` endpoint is configured for both `GET` and `HEAD`.

---

### 2. Keep-Alive Uptime Monitor (Better Stack / UptimeRobot)
* **Target URL:** `https://quranrag.onrender.com/health`
* **Monitoring Interval:** Every 5 minutes (max 14 minutes)
* **Accepted HTTP Methods:** `GET` or `HEAD`

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **Monitor Status** | Check monitor dashboard | Green / "Operational" (200 OK) |
| **Response Time** | View monitor latency graphs | ~200ms - 800ms |

**Troubleshooting Monitor Issues:**
* **Continuous Error / Red Alert:**
  - Verify the URL is exactly `https://quranrag.onrender.com/health` (no typo).
  - Check Render service status to ensure Render didn't suspend the service.
* **Inbox Spammed with Emails:**
  - In Better Stack: Go to **Monitors** -> **Edit** -> Scroll down to **Alerting** -> Toggle off email notifications or remove email from escalation policy.

---

### 3. Qdrant Cloud (Vector Database for RAG)
* **Dashboard:** [https://cloud.qdrant.io](https://cloud.qdrant.io)
* **Required Collection:** `quran_hadith`
* **Configuration:** `QDRANT_URL` and `QDRANT_API_KEY` in `backend/.env` (and Render Environment Variables)

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **Cluster Status** | Run `python check_system.py` or log in to Qdrant Cloud | Cluster shows "Healthy" / "Green" |
| **Collection** | Check collection list in dashboard | `quran_hadith` with ~13,000+ vectors |

**Troubleshooting Qdrant Issues:**
* **Error: `[Errno 104] Connection reset by peer` / `WinError 10054`:**
  - **Cause:** Qdrant Cloud automatically suspended or paused your free cluster due to inactivity, or the cluster endpoint changed.
  - **Fix:** Log in to [cloud.qdrant.io](https://cloud.qdrant.io). Click on your cluster and click **Resume** / **Start**. If expired, create a new free cluster and update `QDRANT_URL` and `QDRANT_API_KEY` in `backend/.env` and in Render's environment settings. Then run `python backend/ingest.py` to rebuild vectors if needed.

---

### 4. Groq Cloud (LLM Inference Engine)
* **Dashboard:** [https://console.groq.com](https://console.groq.com)
* **Active Model:** `qwen/qwen3.8-27b`
* **Configuration:** `GROQ_API_KEY` in `backend/.env` and Render Environment Variables

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **API Key & Model** | Run `python check_system.py` | `Groq Cloud (qwen/qwen3.8-27b): ONLINE` |
| **Free Tier Quota** | Check [console.groq.com/settings/limits](https://console.groq.com/settings/limits) | Rate limits not exceeded (RPM/RPD) |

**Troubleshooting Groq Issues:**
* **HTTP 401 Unauthorized:** Invalid `GROQ_API_KEY`. Generate a new key at console.groq.com and update it.
* **HTTP 404 Model Not Found / Decommissioned:**
  - **Cause:** Groq deprecated an older model (e.g. `qwen3.6-27b`).
  - **Fix:** Ensure `backend/main.py` is set to `qwen/qwen3.8-27b`.
* **HTTP 429 Too Many Requests:** Free tier rate limit reached. Groq resets request quotas every minute/day.

---

### 5. Google Drive Sync & Google OAuth
* **Dashboard:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
* **Component Location:** `mobile_app/screens/SettingsScreen.js`
* **Required OAuth Scopes:** `profile`, `email`, `https://www.googleapis.com/auth/drive.appdata`

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **Sign-In Modal** | Tap "Sign in with Google" in Settings screen | Google account picker appears |
| **Drive Backup** | Tap "Backup to Google Drive" | "Backup Successful" alert |
| **Drive Restore** | Tap "Restore from Google Drive" | Chat history restored into local SQLite |

**Troubleshooting Google Auth / Drive Issues:**
* **Error `DEVELOPER_ERROR` / Code `10` or `12500`:**
  - **Cause:** SHA-1 certificate fingerprint mismatch in Google Cloud Console.
  - **Fix:** If you built a new release APK, the release keystore SHA-1 fingerprint must be added to your Android OAuth Client ID in Google Cloud Console.

---

### 6. Mobile App Frontend (React Native / Expo)
* **Project Directory:** `mobile_app/`
* **API URL Configured:** `mobile_app/App.js` (`https://quranrag.onrender.com/chat`)
* **Security Header:** `x-app-secret: quranrag_mobile_secret_2026`

| Check | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **Chat Send/Receive** | Send any question in the mobile app | Streaming or instant AI response with citations |
| **Surah / Hadith Tabs** | Switch to Quran/Hadith reading screens | Surah list & Hadiths render smoothly |
| **Language Switcher** | Toggle between English and Urdu | Entire UI and AI output adapt to language |
| **Script Switcher** | Toggle between Uthmani and Indo-Pak | Arabic font renders correctly |

---

## 🔍 "What Broke?" Quick Diagnostic Flowchart

If the mobile app shows an error when asking a question, follow this checklist in order:

```text
[Mobile App says "Something went wrong" or fails]
   │
   ├── Step 1: Run `python check_system.py`
   │
   ├── Did "Render Backend Service" FAIL?
   │     └─► Render is sleeping or crashed.
   │         • Open https://quranrag.onrender.com/health in browser to wake it up.
   │         • Check dashboard.render.com logs.
   │
   ├── Did "Qdrant Cloud Cluster" FAIL with Connection Reset / Errno 104?
   │     └─► Qdrant Cloud cluster is paused or suspended.
   │         • Log into https://cloud.qdrant.io and click Resume/Start.
   │
   ├── Did "Groq Cloud" FAIL?
   │     └─► Groq API key expired or rate limit hit.
   │         • Check https://console.groq.com.
   │
   └── Did everything pass in the script, but mobile app still fails?
         └─► Verify:
             • Phone has active internet connection.
             • API URL in mobile_app/App.js matches https://quranrag.onrender.com/chat.
             • "x-app-secret" header in mobile_app/App.js matches backend/main.py.
```
