import json
import re
from typing import Optional

import httpx
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from pypdf import PdfReader
from youtube_transcript_api import YouTubeTranscriptApi
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    OPENROUTER_URL,
    API_TIMEOUT,
    MAX_INPUT_CHARACTERS,
)

app = FastAPI(title="Tesseract Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    number_of_cards: Optional[int] = 10

class URLRequest(BaseModel):
    url: str
    number_of_cards: Optional[int] = 10

class YouTubeRequest(BaseModel):
    url: str
    number_of_cards: Optional[int] = 10

# health check for API
@app.get("/health")
def healt_check():
    return {"status" : "ok"}

# clean spacing using reguler expression
def clean_text(text: str) -> str:
    text = re.sub(r"\s+", "", text)
    return text.strip()

# clean html tags for raw text
def extract_article_text(url: str) -> str:
    response = requests.get(url, timeout=15)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Could not fetch URL")
    
    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    
    paragraphs = soup.find_all("p")
    text = " ".join(p.get_text(" ", strip=True) for p in paragraphs)

    if not text:
        raise HTTPException(status_code=400, detail="No readable article text found")
    
    return clean_text(text)

# get youtube id 
def extract_youtube_video_id(url: str) -> str:
    """
    https://www.youtube.com/watch?v=aR20FWCCjAs
    
    v=aR20FWCCjAs is video id
    """
    patterns = [
        r"v=([^&]+)",
        r"youtu\.be/([^?&]+)",
        r"youtube\.com/shorts/([^?&]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise HTTPException(status_code=400, detail="Invalid YouTube URL")

# get manual/auto-generated transcript
def extract_youtube_transcript(url: str) -> str:
    video_id = extract_youtube_video_id(url)

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        try:
            transcript = transcript_list.find_transcript(["en"])
        except Exception:
            transcript = transcript_list.find_generated_transcript(["en"])
        
        transcript_data = transcript.fetch()
    
    except Exception as error:
        raise HTTPException(
            status_code=400, 
            detail=f"Transcript not aviable or blocked for this video: {str(error)}"
        )

    text = "".join(item["text"] for item in transcript_data)
    return clean_text(text)

# get text from pdf
def extract_pdf_text(file: UploadFile) -> str:
    reader = PdfReader(file.file)

    text_parts = []

    for page in reader.pages:
        text_parts.append(page.extract_text() or "")
    
    text = " ".join(text_parts)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in PDF")
    
    return clean_text(text)

# prompt for OpenRouter AI model
def build_flashcard_prompt(text: str, number_of_cards: int) -> str:
    return f"""
            You are an AI study assistant.

            Generate study material from the content below.

            Return ONLY valid JSON in this format:

            {{
            "summary": "short summary here",
            "key_concepts": ["concept 1", "concept 2"],
            "flashcards": [
                {{
                "question": "question here",
                "answer": "answer here",
                "difficulty": "easy",
                "type": "definition",
                "tags": ["tag1", "tag2"]
                }}
            ]
            }}

            Rules:
            - Generate exactly {number_of_cards} flashcards.
            - Use clear student-friendly language.
            - Do not include markdown.
            - Return only JSON.

            Content:
            {text[:MAX_INPUT_CHARACTERS]}
            """

async def call_openrouter(prompt: str):
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is missing in .env"
        )

    headers = {
        "Authorization": F"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": f"{OPENROUTER_MODEL}",
        "messages": [
            {
                "role": "user",
                "content": f"{prompt}"
            }
        ],
    }

    async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )
    
    data = response.json()
    content = data["choices"][0]["message"]["content"]

    try: 
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "raw_response": content,
            "warning": "Model did not return valid JSON"
        }
    
# endpoints
@app.post("/api/generate-from-text")
async def generate_from_text(request: TextRequest):
    text = clean_text(request.text)
    prompt = build_flashcard_prompt(text, request.number_of_cards)
    result = await call_openrouter(prompt)

    return {
        "source_type": "text",
        "result": result,
    }

@app.post("/api/generate-from-url")
async def generate_from_url(request: URLRequest):
    text = clean_text(request.url)
    prompt = build_flashcard_prompt(text, request.number_of_cards)
    result = await call_openrouter(prompt)

    return {
        "source_type": "url",
        "result": result
    }

@app.post("/api/generate-from-youtube")
async def generate_from_youtube(request: YouTubeRequest):
    text = extract_youtube_transcript(request.url)
    prompt = build_flashcard_prompt(text, request.number_of_cards)
    result = await call_openrouter(prompt)

    return {
        "source_type": "youtube",
        "result": result,
    }

@app.post("/api/generate-from-pdf")
async def generate_from_pdf(
    file: UploadFile = File(...),
    number_of_cards: int = 10,
):
    text = extract_pdf_text(file)
    prompt = build_flashcard_prompt(text, number_of_cards)
    result = await call_openrouter(prompt)

    return {
        "source_type": "pdf",
        "result": result,
    }