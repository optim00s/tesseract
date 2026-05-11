import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "nvidia/nemotron-3-super-120b-a12b:free"
)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

API_TIMEOUT = int(os.getenv("API_TIMEOUT", "90"))

MAX_INPUT_CHARACTERS = int(os.getenv("MAX_INPUT_CHARACTERS", "12000"))