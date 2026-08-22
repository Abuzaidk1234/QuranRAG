import sqlite3
import json
import os

db_path = "rahnavard.db"
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
c = conn.cursor()

# Quran Tables
c.execute("""
CREATE TABLE surahs (
    id INTEGER PRIMARY KEY,
    name TEXT,
    englishName TEXT,
    englishNameTranslation TEXT,
    revelationType TEXT,
    numberOfAyahs INTEGER
)
""")

c.execute("""
CREATE TABLE ayahs (
    id INTEGER PRIMARY KEY,
    surah_id INTEGER,
    numberInSurah INTEGER,
    juz INTEGER,
    arabic TEXT,
    english TEXT,
    urdu TEXT,
    FOREIGN KEY(surah_id) REFERENCES surahs(id)
)
""")

# Load Quran Data
print("Loading Quran data...")
with open("data/quran_ara.json", "r", encoding="utf-8") as f:
    ara = json.load(f)["data"]["surahs"]
with open("data/quran_eng.json", "r", encoding="utf-8") as f:
    eng = json.load(f)["data"]["surahs"]
with open("data/quran_urd.json", "r", encoding="utf-8") as f:
    urd = json.load(f)["data"]["surahs"]

for s_ara, s_eng, s_urd in zip(ara, eng, urd):
    # Insert Surah
    c.execute("""
        INSERT INTO surahs (id, name, englishName, englishNameTranslation, revelationType, numberOfAyahs)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (s_ara["number"], s_ara["name"], s_ara["englishName"], s_ara["englishNameTranslation"], s_ara["revelationType"], len(s_ara["ayahs"])))
    
    # Insert Ayahs
    for a_ara, a_eng, a_urd in zip(s_ara["ayahs"], s_eng["ayahs"], s_urd["ayahs"]):
        ara_text = a_ara["text"]
        # If not Surah 1 (Al-Fatiha) and is the first Ayah, strip prefixed Bismillah because decorative header displays it
        if s_ara["number"] != 1 and a_ara["numberInSurah"] == 1:
            prefixes = [
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                'بِّسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ',
                'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ',
                'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
                'بِّسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
            ]
            for p in prefixes:
                if ara_text.startswith(p):
                    ara_text = ara_text[len(p):].strip()
                    break

        c.execute("""
            INSERT INTO ayahs (id, surah_id, numberInSurah, juz, arabic, english, urdu)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (a_ara["number"], s_ara["number"], a_ara["numberInSurah"], a_ara["juz"], ara_text, a_eng["text"], a_urd["text"]))

conn.commit()
print("Quran data loaded.")

# Hadith Tables
c.execute("""
CREATE TABLE hadith_books (
    id TEXT PRIMARY KEY,
    name TEXT,
    collection TEXT
)
""")

c.execute("""
CREATE TABLE hadith_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT,
    chapter_id INTEGER,
    arabic TEXT,
    english TEXT,
    urdu TEXT,
    FOREIGN KEY(book_id) REFERENCES hadith_books(id)
)
""")

c.execute("""
CREATE TABLE hadiths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT,
    chapter_id INTEGER,
    idInBook INTEGER,
    arabic TEXT,
    english_narrator TEXT,
    english_text TEXT,
    urdu TEXT,
    FOREIGN KEY(book_id) REFERENCES hadith_books(id)
)
""")

books = [
    ("bukhari", "Sahih al-Bukhari"),
    ("muslim", "Sahih Muslim"),
    ("abudawud", "Sunan Abi Dawud"),
    ("tirmidhi", "Jami' at-Tirmidhi"),
    ("nasai", "Sunan an-Nasai")
]

for book_id, book_name in books:
    print(f"Loading Hadith data for {book_name}...")
    c.execute("INSERT INTO hadith_books (id, name, collection) VALUES (?, ?, ?)", (book_id, book_name, "hadith"))
    
    path = f"data/hadith_{book_id}.json"
    if not os.path.exists(path):
        print(f"File {path} not found.")
        continue
        
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    for ch in data.get("chapters", []):
        c.execute("""
            INSERT INTO hadith_chapters (book_id, chapter_id, arabic, english, urdu)
            VALUES (?, ?, ?, ?, ?)
        """, (book_id, ch.get("id"), ch.get("arabic"), ch.get("english"), ch.get("urdu")))
        
    for h in data.get("hadiths", []):
        eng_data = h.get("english", {})
        if isinstance(eng_data, str):
            eng_narrator = ""
            eng_text = eng_data
        else:
            eng_narrator = eng_data.get("narrator", "")
            eng_text = eng_data.get("text", "")
            
        c.execute("""
            INSERT INTO hadiths (book_id, chapter_id, idInBook, arabic, english_narrator, english_text, urdu)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (book_id, h.get("chapterId"), h.get("idInBook"), h.get("arabic"), eng_narrator, eng_text, h.get("urdu")))

conn.commit()

# Create indexes for performance
c.execute("CREATE INDEX idx_ayahs_surah ON ayahs(surah_id)")
c.execute("CREATE INDEX idx_ayahs_juz ON ayahs(juz)")
c.execute("CREATE INDEX idx_hadiths_book_chapter ON hadiths(book_id, chapter_id)")

conn.close()
print("Database generation complete!")

import shutil
assets_db_path = "mobile_app/assets/rahnavard.db"
shutil.copy(db_path, assets_db_path)
print(f"Copied {db_path} to {assets_db_path} successfully!")
