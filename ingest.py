import json
import os
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = "data"

def load_quran():
    print("Loading Quran...")
    docs = []
    
    with open(os.path.join(DATA_DIR, "quran_eng.json"), "r", encoding="utf-8") as f:
        quran_eng = json.load(f)["data"]["surahs"]
        
    with open(os.path.join(DATA_DIR, "quran_ara.json"), "r", encoding="utf-8") as f:
        quran_ara = json.load(f)["data"]["surahs"]
        
    for surah_eng, surah_ara in zip(quran_eng, quran_ara):
        surah_name = surah_eng["englishName"]
        surah_num = surah_eng["number"]
        
        for ayah_eng, ayah_ara in zip(surah_eng["ayahs"], surah_ara["ayahs"]):
            ayah_num = ayah_eng["numberInSurah"]
            text_eng = ayah_eng["text"]
            text_ara = ayah_ara["text"]
            
            content = f"Quran {surah_num}:{ayah_num} (Surah {surah_name})\nArabic: {text_ara}\nEnglish: {text_eng}"
            metadata = {
                "source": "Quran",
                "surah": surah_name,
                "surah_number": surah_num,
                "ayah_number": ayah_num
            }
            docs.append(Document(page_content=content, metadata=metadata))
    
    print(f"Loaded {len(docs)} verses from Quran.")
    return docs

def load_hadiths():
    books = ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah"]
    docs = []
    
    for book in books:
        filepath = os.path.join(DATA_DIR, f"hadith_{book}.json")
        if not os.path.exists(filepath):
            continue
            
        print(f"Loading Hadiths from {book}...")
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        metadata_book = data.get("metadata", {}).get("english", {}).get("title", book.capitalize())
        
        for h in data.get("hadiths", []):
            eng_data = h.get("english", {})
            if not eng_data or not eng_data.get("text"):
                continue
                
            hadith_num = h.get("idInBook", h.get("id", "unknown"))
            text_eng = eng_data.get("text", "")
            text_ara = h.get("arabic", "")
            narrator = eng_data.get("narrator", "")
            
            content = f"Hadith from {metadata_book}, Number {hadith_num}\nNarrator: {narrator}\nArabic: {text_ara}\nEnglish: {text_eng}"
            metadata = {
                "source": "Hadith",
                "book": metadata_book,
                "hadith_number": str(hadith_num)
            }
            docs.append(Document(page_content=content, metadata=metadata))
                
    print(f"Loaded {len(docs)} hadiths.")
    return docs

def main():
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    if not qdrant_url or not qdrant_api_key:
        print("ERROR: QDRANT_URL or QDRANT_API_KEY not found in .env")
        return
        
    if not google_api_key:
        print("ERROR: GOOGLE_API_KEY not found in .env")
        return

    quran_docs = load_quran()
    hadith_docs = load_hadiths()
    all_docs = quran_docs + hadith_docs
    
    print(f"Total documents to ingest: {len(all_docs)}")
    print("Initializing Google Generative AI Embeddings...")
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=google_api_key)
    
    print("Connecting to Qdrant Cloud...")
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=60)
    collection_name = "quran_hadith"
    
    # Check if collection exists, if so, delete it because dimensions have changed to 768
    collections = client.get_collections()
    if collection_name in [c.name for c in collections.collections]:
        print(f"Deleting old collection '{collection_name}' to update dimensions...")
        client.delete_collection(collection_name=collection_name)
        
    print(f"Creating new collection '{collection_name}' (dim=768)...")
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )
    
    print("Ingesting documents into Qdrant Cloud (this will take a few minutes)...")
    
    # Use QdrantVectorStore to add documents
    vector_store = QdrantVectorStore(
        client=client,
        collection_name=collection_name,
        embedding=embeddings,
    )
    
    batch_size = 500
    for i in range(0, len(all_docs), batch_size):
        batch = all_docs[i:i+batch_size]
        print(f"Uploading batch {i} to {i+len(batch)}...")
        vector_store.add_documents(batch)
            
    print("Ingestion complete. Qdrant Database is ready in the cloud!")

if __name__ == "__main__":
    main()
