import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.globals import set_llm_cache
from langchain_community.cache import InMemoryCache

# Enable in-memory caching to save API calls for repeated questions
set_llm_cache(InMemoryCache())

load_dotenv()

app = FastAPI(title="Quran & Hadith RAG API")

# Add CORS Middleware to allow web frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g. localhost:8081)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

CHROMA_DB_DIR = "chroma_db"

class ChatRequest(BaseModel):
    query: str
    provider: str = "groq"  # "groq" or "gemini"
    filter: str = "all"     # "all", "quran", or "hadith"
    history: list = []      # list of dicts: {"role": "user"/"ai", "text": "..."}

class Source(BaseModel):
    source: str
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]

# Global variables to hold model and db
db = None
retriever = None

system_prompt = (
    "You are a knowledgeable, professional, and helpful Islamic scholar. "
    "Your primary goal is to answer the user's question accurately using the provided scripture context. "
    "CRITICAL RULE: DO NOT ever mention 'the provided context', 'the text provided', or 'these verses state'. "
    "Speak naturally and professionally as if you inherently know the scriptures. "
    "If the answer cannot be deduced entirely from the context, you MAY use your general Islamic knowledge to provide a helpful answer, "
    "but you should politely clarify what is explicitly mentioned in the provided text versus general knowledge. "
    "Do not just say 'I do not know' unless you truly have no information to offer. "
    "Always cite the Surah/Ayah or the Hadith book and number naturally in your response when referencing specific texts.\n\n"
    "Context:\n{context}"
)

from langchain_core.prompts import MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_classic.chains import create_history_aware_retriever

prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

contextualize_q_system_prompt = (
    "You are an Islamic search query optimizer. "
    "Given a chat history and the latest user question, "
    "formulate a highly descriptive standalone search query optimized for a vector database. "
    "If the user asks a short question (e.g. 'what about Zaqqum?'), expand it into a detailed search query "
    "(e.g. 'What is the Zaqqum tree mentioned in the Quran and Islamic scripture?'). "
    "Do NOT answer the question, just reformulate it into the best possible search string."
)
contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

@app.on_event("startup")
async def startup_event():
    global db, retriever
    
    # Initialize embeddings
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Load Chroma DB
    if not os.path.exists(CHROMA_DB_DIR):
        print("Warning: Chroma DB directory not found. Please run ingest.py first.")
        return
        
    db = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
    # Reduced 'k' from 10 to 6 to save approximately 40% of input tokens while maintaining high accuracy
    retriever = db.as_retriever(search_kwargs={"k": 6})
    print("Vector Database Retriever initialized successfully.")

def get_llm(provider: str):
    if provider.lower() == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in the environment.")
        # Using Qwen 3.6 27B which is highly capable in English and Arabic and currently active on your tier
        return ChatGroq(model_name="qwen/qwen3.6-27b", groq_api_key=api_key)
    elif provider.lower() == "gemini":
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set in the environment.")
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not db:
        raise HTTPException(status_code=500, detail="Database is not initialized. Run ingest.py first.")
        
    try:
        llm = get_llm(request.provider)
        
        # Apply context filter dynamically
        search_kwargs = {"k": 6}
        if request.filter.lower() == "quran":
            search_kwargs["filter"] = {"source": "Quran"}
        elif request.filter.lower() == "hadith":
            search_kwargs["filter"] = {"source": "Hadith"}
            
        temp_retriever = db.as_retriever(search_kwargs=search_kwargs)
        
        # 1. Query Expansion & History Awareness
        # We use create_history_aware_retriever to rewrite short or contextual queries into detailed standalone search queries.
        history_aware_retriever = create_history_aware_retriever(
            llm, temp_retriever, contextualize_q_prompt
        )
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt_template)
        retrieval_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
        
        # Convert raw history to LangChain messages
        langchain_history = []
        for msg in request.history:
            if msg.get("role") == "user":
                langchain_history.append(HumanMessage(content=msg.get("text", "")))
            else:
                langchain_history.append(AIMessage(content=msg.get("text", "")))
        
        response = retrieval_chain.invoke({"input": request.query, "chat_history": langchain_history})
        
        answer = response["answer"]
        docs = response["context"]
        
        sources = []
        for doc in docs:
            sources.append(Source(
                source=doc.metadata.get("source", "Unknown"),
                content=doc.page_content,
                metadata=doc.metadata
            ))
            
        return ChatResponse(answer=answer, sources=sources)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

import functools
import json

import functools
import json

@functools.lru_cache(maxsize=1)
def load_quran_data():
    with open('data/quran_ara.json', 'r', encoding='utf-8') as f:
        quran_ara = json.load(f)['data']['surahs']
    with open('data/quran_eng.json', 'r', encoding='utf-8') as f:
        quran_eng = json.load(f)['data']['surahs']
    return quran_ara, quran_eng


@app.get("/quran/juzs")
async def get_juzs():
    juzs = [{"id": i, "name": f"Juz {i}"} for i in range(1, 31)]
    return {"juzs": juzs}

@app.get("/quran/juz/{juz_number}")
async def get_juz(juz_number: int):
    quran_ara, quran_eng = load_quran_data()
    if juz_number < 1 or juz_number > 30:
        raise HTTPException(status_code=404, detail="Juz not found")
        
    juz_ayahs = []
    
    for surah_idx in range(len(quran_ara)):
        ara_surah = quran_ara[surah_idx]
        eng_surah = quran_eng[surah_idx]
        surah_number = surah_idx + 1
        
        for i in range(len(ara_surah['ayahs'])):
            if ara_surah['ayahs'][i].get('juz') == juz_number:
                arabic_text = ara_surah['ayahs'][i]['text']
                
                # Check for bismillah prefix in arabic text (except Al-Fatihah and At-Tawbah)
                if surah_number not in [1, 9] and ara_surah['ayahs'][i]['numberInSurah'] == 1:
                    bismillah_prefix = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ '
                    bismillah_prefix_2 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
                    if arabic_text.startswith(bismillah_prefix):
                        arabic_text = arabic_text[len(bismillah_prefix):]
                    elif arabic_text.startswith(bismillah_prefix_2):
                        arabic_text = arabic_text[len(bismillah_prefix_2):]
                
                english_text = eng_surah['ayahs'][i]['text']
                
                juz_ayahs.append({
                    "surahNumber": surah_number,
                    "surahNameArabic": ara_surah['name'],
                    "surahNameEnglish": ara_surah['englishName'],
                    "numberInSurah": ara_surah['ayahs'][i]['numberInSurah'],
                    "number": ara_surah['ayahs'][i]['number'],
                    "arabic": arabic_text,
                    "english": english_text
                })
                
    return {"juz": juz_number, "ayahs": juz_ayahs}

@app.get("/quran/surahs")
async def get_surahs():
    quran_ara, quran_eng = load_quran_data()
    surahs = []
    for s in quran_ara:
        surahs.append({
            "number": s["number"],
            "name": s["name"],
            "englishName": s["englishName"],
            "englishNameTranslation": s["englishNameTranslation"],
            "revelationType": s.get("revelationType", "").upper(),
            "numberOfAyahs": len(s.get("ayahs", []))
        })
    return {"surahs": surahs}

@app.get("/quran/surah/{surah_number}")
async def get_surah(surah_number: int):
    quran_ara, quran_eng = load_quran_data()
    if surah_number < 1 or surah_number > 114:
        raise HTTPException(status_code=404, detail="Surah not found")
        
    ara_surah = quran_ara[surah_number - 1]
    eng_surah = quran_eng[surah_number - 1]
    
    bismillah_prefix = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ '
    bismillah_prefix_2 = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
    
    ayahs = []
    for i in range(len(ara_surah['ayahs'])):
        arabic_text = ara_surah['ayahs'][i]['text']
        
        if surah_number not in [1, 9] and ara_surah['ayahs'][i]['numberInSurah'] == 1:
            if arabic_text.startswith(bismillah_prefix):
                arabic_text = arabic_text[len(bismillah_prefix):]
            elif arabic_text.startswith(bismillah_prefix_2):
                arabic_text = arabic_text[len(bismillah_prefix_2):].strip()
                
        ayahs.append({
            "numberInSurah": ara_surah['ayahs'][i]['numberInSurah'],
            "number": ara_surah['ayahs'][i]['number'],
            "arabic": arabic_text,
            "english": eng_surah['ayahs'][i]['text']
        })
        
    return {
        "number": ara_surah["number"],
        "name": ara_surah["name"],
        "englishName": ara_surah["englishName"],
        "ayahs": ayahs
    }

@functools.lru_cache(maxsize=10)
def load_hadith_book(book_name: str):
    file_path = f'data/hadith_{book_name}.json'
    if not os.path.exists(file_path):
        return None
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.get("/hadiths/books")
async def get_hadith_books():
    books_meta = [
        {"id": "bukhari", "name": "Sahih al-Bukhari"},
        {"id": "muslim", "name": "Sahih Muslim"},
        {"id": "abudawud", "name": "Sunan Abi Dawud"},
        {"id": "nasai", "name": "Sunan an-Nasai"},
        {"id": "tirmidhi", "name": "Jami at-Tirmidhi"}
    ]
    for b in books_meta:
        data = load_hadith_book(b["id"])
        if data and "hadiths" in data:
            b["total_hadiths"] = len(data["hadiths"])
        else:
            b["total_hadiths"] = 0
    return {"books": books_meta}

@app.get("/hadiths/{book_name}")
async def get_hadith_chapters(book_name: str):
    data = load_hadith_book(book_name)
    if not data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Calculate range for each chapter
    chapters = data["chapters"]
    hadiths = data["hadiths"]
    
    from collections import defaultdict
    chapter_hadith_ids = defaultdict(list)
    for h in hadiths:
        chapter_hadith_ids[str(h.get("chapterId"))].append(h.get("idInBook"))
    
    # We must deepcopy or mutate carefully, but since it's cached, mutating is okay as long as we only add fields.
    import copy
    chapters_out = copy.deepcopy(chapters)
    
    for c in chapters_out:
        c_id = str(c.get("id"))
        ids = chapter_hadith_ids.get(c_id, [])
        if ids:
            valid_ids = [i for i in ids if isinstance(i, (int, float))]
            if valid_ids:
                c["range"] = f"Hadiths {min(valid_ids)} - {max(valid_ids)}"
            else:
                c["range"] = "No hadiths"
        else:
            c["range"] = "No hadiths"

    return {"metadata": data.get("metadata", {}), "chapters": chapters_out}

@app.get("/hadiths/{book_name}/{chapter_id}")
async def get_hadiths_by_chapter(book_name: str, chapter_id: int):
    data = load_hadith_book(book_name)
    if not data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    chapter_hadiths = [h for h in data["hadiths"] if h["chapterId"] == chapter_id]
    return {"hadiths": chapter_hadiths}

@app.get("/hadiths/{book_name}/search/{number}")
async def search_hadith_by_number(book_name: str, number: int):
    data = load_hadith_book(book_name)
    if not data:
        raise HTTPException(status_code=404, detail="Book not found")
    
    for h in data["hadiths"]:
        if h["idInBook"] == number:
            return {"hadith": h}
            
    raise HTTPException(status_code=404, detail="Hadith not found")
