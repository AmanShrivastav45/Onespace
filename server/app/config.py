from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

TICKETS_FILE = DATA_DIR / "tickets.json"
MISC_FILE = DATA_DIR / "misc.json"
CONTEXT_FILE = DATA_DIR / "context.json"
DOCUMENTS_FILE = DATA_DIR / "documents.json"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
