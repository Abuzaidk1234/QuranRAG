# Bayan (بیان) - AI-Powered Islamic Assistant

![Bayan Banner](https://img.shields.io/badge/Status-Release_Ready-success?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-blue?style=for-the-badge)
![Tech](https://img.shields.io/badge/Framework-React_Native-61DAFB?style=for-the-badge&logo=react)

**Bayan** is a fully-featured, AI-powered Islamic assistant available as a mobile application. It features a highly accurate Retrieval-Augmented Generation (RAG) backend utilizing Qdrant and LLaMA 3 via Groq to provide authentic answers from the Qur'an and authentic Hadith collections. 

## 🌟 Key Features

*   **AI Chat Assistant**: Ask any question and receive accurate, referenced answers from authentic sources.
*   **Authentic Sources Only**: The knowledge base is strictly filtered to include the Qur'an and authentic (Sahih/Hasan) Hadith.
*   **Dual-Script Support**: Seamlessly switch between the **Uthmani** and **Indo-Pak** Arabic scripts for reading.
*   **Bilingual**: Full support for both **English** and **Urdu** throughout the UI and Chat.
*   **Google Drive Backup**: Safely backup and restore your chat history directly to your personal Google Drive.
*   **Customizable UI**: Choose between Light, Dark, or System themes. Adjust translation and Arabic font sizes for maximum readability.

---

## 📱 Mobile App (Frontend)

The frontend is built with **React Native (Expo)**, offering a smooth, native experience for both Android and iOS devices. 

### Quick Start (Mobile)
To run the mobile app locally:
```bash
cd mobile_app
npm install
npx expo start
```
*To build the production APK/AAB for Android:*
```bash
cd mobile_app
npx expo prebuild
cd android
.\gradlew.bat assembleRelease   # For local APK
.\gradlew.bat bundleRelease     # For Play Store AAB
```

---

## ⚙️ RAG Backend (API)

The backend is a **FastAPI** application that orchestrates the RAG pipeline. It leverages **Groq** for lightning-fast LLaMA 3 inference and **Qdrant** for vector search over our Islamic knowledge base.

### Quick Start (Backend)
1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```
2. Set up your `.env` file with your `GROQ_API_KEY` and `QDRANT_API_KEY`.
3. Run the server:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔒 Privacy & Data Safety

Bayan prioritizes user privacy. We do not store your chat logs on our servers. All chat history is stored locally on your device (SQLite) and can be securely backed up exclusively to your own personal Google Drive via our OAuth integration.

*Read our full [Privacy Policy](./privacy-policy.md).*

---

## 👨‍💻 Developer

**Made with ❤️ by Abuzaid**
*   [GitHub](https://github.com/Abuzaidk1234)
*   [LinkedIn](https://www.linkedin.com/in/abuzaid-khan-b08998279/)
