import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root or backend
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")

class Settings:
    PROJECT_NAME: str = "NovaAPI Doc AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # LLM Settings
    API_KEY: str = os.getenv("API_KEY", "")
    API_URL: str = os.getenv("API_URL", "https://api.openai.com/v1/chat/completions")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o-mini")
    
    # RAG Settings
    CHUNK_SIZE: int = 400
    CHUNK_OVERLAP: int = 60
    TOP_K_RETRIEVAL: int = 5
    SIMILARITY_THRESHOLD: float = 0.25
    
    # Paths
    PROMPTS_DIR: Path = BASE_DIR / "prompts"
    CORPUS_DIR: Path = BASE_DIR / "data" / "corpus"
    INDEX_FILE: Path = BASE_DIR / "data" / "vector_index.json"

settings = Settings()
