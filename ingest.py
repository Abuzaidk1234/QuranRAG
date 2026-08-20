import json
import os
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

DATA_DIR = "data"
CHROMA_DB_DIR = "chroma_db"

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
    quran_docs = load_quran()
    hadith_docs = load_hadiths()
    all_docs = quran_docs + hadith_docs
    
    print(f"Total documents to ingest: {len(all_docs)}")
    print("Initializing embedding model (this may take a moment to download)...")
    
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Creating Chroma database and ingesting documents...")
    # Batch ingestion to avoid memory overload
    batch_size = 5000
    db = None
    
    for i in range(0, len(all_docs), batch_size):
        batch = all_docs[i:i+batch_size]
        print(f"Ingesting batch {i} to {i+len(batch)}...")
        if db is None:
            db = Chroma.from_documents(batch, embeddings, persist_directory=CHROMA_DB_DIR)
        else:
            db.add_documents(batch)
            
    print("Ingestion complete. Database is ready.")

if __name__ == "__main__":
    main()
