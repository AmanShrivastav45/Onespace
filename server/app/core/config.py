import os
from pathlib import Path
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

SERVER_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(SERVER_ROOT / '.env')
TZ = ZoneInfo(os.getenv('APP_TIMEZONE', 'Asia/Kolkata'))
PROMPT_PATH = SERVER_ROOT / 'prompts' / 'polishing.md'
