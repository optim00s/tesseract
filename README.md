# Tesseract

Tesseract is a full-stack AI study assistant that transforms content from YouTube videos, URLs, PDFs, and raw text into concise summaries, key concepts, and interactive flashcards.

## Live Demo

- **Frontend:** [fs-tesseract.vercel.app](https://fs-tesseract.vercel.app)

## Features

- **Four input modes:** raw text, article URL, YouTube video, or PDF upload
- **AI-generated output:** summary, key concepts, and a configurable number of flashcards
- **Interactive flashcard carousel** with difficulty labels, tags, and click-to-reveal answers
- **Responsive UI** built with vanilla JS and Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Backend | FastAPI (Python) |
| AI | OpenRouter — `nvidia/nemotron-3-super-120b-a12b:free` |
| Deployment | Vercel (both frontend and backend) |

## Project Structure
```
tesseract/
├── .gitignore
├── README.md
├── backend/
│   ├── app/
│   │   ├── config.py       # Env vars, CORS config
│   │   └── main.py         # FastAPI app, routes, extraction logic
│   ├── .env                # Local secrets (git-ignored)
│   ├── .env.example        # Env var template
│   └── requirements.txt
└── frontend/
    ├── assets/
    │   └── hero.png
    ├── src/
    │   ├── api.js          # API client (local + production routing)
    │   └── generate.js     # UI logic, tab switching, flashcard carousel
    ├── styles/
    │   ├── input.css       # Tailwind entry point
    │   └── output.css      # Compiled CSS (git-ignored)
    ├── generate.html        # Main app page
    ├── index.html           # Landing page
    ├── package.json
    ├── package-lock.json
    └── tailwind.config.js
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/generate-from-text` | Generate from raw text |
| `POST` | `/api/generate-from-url` | Generate from article URL |
| `POST` | `/api/generate-from-youtube` | Generate from YouTube URL |
| `POST` | `/api/generate-from-pdf` | Generate from PDF upload |

All generation endpoints accept a `number_of_cards` parameter (default: `10`) and return:

```json
{
  "source_type": "text | url | youtube | pdf",
  "result": {
    "summary": "...",
    "key_concepts": ["..."],
    "flashcards": [
      {
        "question": "...",
        "answer": "...",
        "difficulty": "easy | medium | hard",
        "type": "...",
        "tags": ["..."]
      }
    ]
  }
}
```

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # fill in your OpenRouter key
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run build               # compiles Tailwind CSS
```

Open `frontend/index.html` directly in a browser, or serve it with any static server (e.g. VS Code Live Server). The API client automatically targets `localhost:8000` when running locally.

## Environment Variables

Create `backend/.env` based on `.env.example`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
API_TIMEOUT=90
MAX_INPUT_CHARACTERS=12000

# Production frontend URL (comma-separated for multiple origins)
CORS_ORIGINS=https://your-project-name.vercel.app

# Set to true to allow all *.vercel.app preview URLs
CORS_ALLOW_VERCEL_PREVIEWS=false
```

## Deployment (Vercel)

Both projects deploy from the same GitHub repository (`optim00s/tesseract`).

### Backend

Set the root directory to `backend` and add all environment variables from `.env.example` in the Vercel dashboard. Make sure `CORS_ORIGINS` is set to your frontend's Vercel URL.

### Frontend

Set the root directory to `frontend`. No environment variables required — the API base URL is resolved at runtime in `src/api.js`.