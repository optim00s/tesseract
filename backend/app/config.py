import os
from dotenv import load_dotenv

load_dotenv()

def parse_csv_env(value: str) -> list[str]:
    return [
        item.strip().rstrip("/")
        for item in value.split(",")
        if item.strip()
    ]


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "nvidia/nemotron-3-super-120b-a12b:free"
)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

API_TIMEOUT = int(os.getenv("API_TIMEOUT", "90"))

MAX_INPUT_CHARACTERS = int(os.getenv("MAX_INPUT_CHARACTERS", "12000"))

LOCAL_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

PRODUCTION_CORS_ORIGINS = parse_csv_env(
    os.getenv("CORS_ORIGINS", "")
)

CORS_ORIGINS = LOCAL_CORS_ORIGINS + PRODUCTION_CORS_ORIGINS

CORS_ALLOW_VERCEL_PREVIEWS = (
    os.getenv("CORS_ALLOW_VERCEL_PREVIEWS", "false").lower() == "true"
)

CORS_ORIGIN_REGEX = (
    r"https://.*\.vercel\.app"
    if CORS_ALLOW_VERCEL_PREVIEWS
    else None
)