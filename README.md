# Quran & Hadith RAG API

This is a free-to-build Retrieval-Augmented Generation (RAG) backend for querying the Quran and authentic Hadiths using Python, FastAPI, ChromaDB, and Google Gemini.

## Features
- **100% Free**: Uses local vector database (ChromaDB), free embedding models (HuggingFace `all-MiniLM-L6-v2`), and the free tier of the Gemini API.
- **Authentic Only**: Ingests the entire Quran and filters Hadiths (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah) to include only "Sahih" and "Hasan" (authentic/good) gradings.
- **API First**: The `main.py` runs a FastAPI server, making it fully compatible with any Web frontend (React, Next.js) or Mobile app (Flutter, React Native).
- **Streamlit MVP**: Includes a quick `app.py` UI to test the RAG pipeline over a web browser.

## Getting Started

### 1. Prerequisites
Ensure you have Python 3.10+ installed.
Set up your virtual environment and install dependencies:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download Data
Download the JSON datasets for the Quran and Hadiths:
```bash
python download_data.py
```
*Note: This will download several JSON files into the `data/` directory.*

### 3. Setup Environment Variables
Copy the `.env.example` file to `.env` and add your Google Gemini API Key.
```bash
copy .env.example .env
```
*(Get a free API key from [Google AI Studio](https://aistudio.google.com/))*

### 4. Build the Knowledge Base
Run the ingestion script to convert all text into vectors and save them into the local ChromaDB. **This might take a few minutes to run** as it computes embeddings for thousands of Ayahs and Hadiths.
```bash
python ingest.py
```

### 5. Run the Backend Server
Start the FastAPI backend:
```bash
uvicorn main:app --reload
```
The API will run at `http://localhost:8000`. You can view the automatic API documentation at `http://localhost:8000/docs`.

### 6. Run the Frontend MVP
In a separate terminal, run the Streamlit web app to test your assistant:
```bash
streamlit run app.py
```

---

## Connecting Your Mobile App

Because this is a FastAPI backend, connecting your mobile app (e.g., Flutter) is incredibly simple. You just need to make a POST request to the `/chat` endpoint.

### Example Request (Dart/Flutter)
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> askAssistant(String question) async {
  final url = Uri.parse('http://YOUR_SERVER_IP:8000/chat');
  final response = await http.post(
    url,
    headers: {"Content-Type": "application/json"},
    body: jsonEncode({"query": question}),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print("Answer: ${data['answer']}");
    // You can also access data['sources'] to display references
  } else {
    print("Error: ${response.statusCode}");
  }
}
```

## Deployment Options (Free)
1. **Render (Web Service)**: Deploy your FastAPI backend to Render's free tier. 
2. **Streamlit Community Cloud**: Deploy `app.py` for free.
3. **Pinecone/Qdrant**: If ChromaDB becomes too large for free cloud hosting, change the `ingest.py` and `main.py` to use Pinecone's serverless free tier.
