import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

client.create_payload_index(
    collection_name="quran_hadith",
    field_name="metadata.source",
    field_schema="keyword"
)

print("Index created successfully!")
