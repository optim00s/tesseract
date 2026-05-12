const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

const PRODUCTION_API_BASE_URL = "https://fs-tesseract-backend.vercel.app";

const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? LOCAL_API_BASE_URL
    : PRODUCTION_API_BASE_URL;

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Something went wrong");
  }

  return await response.json();
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  return await handleResponse(response);
}

export async function generateFromText(text, numberOfCards = 5) {
  const response = await fetch(`${API_BASE_URL}/api/generate-from-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      number_of_cards: numberOfCards,
    }),
  });

  return await handleResponse(response);
}

export async function generateFromURL(url, numberOfCards = 5) {
  const response = await fetch(`${API_BASE_URL}/api/generate-from-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      number_of_cards: numberOfCards,
    }),
  });

  return await handleResponse(response);
}

export async function generateFromYouTube(url, numberOfCards = 5) {
  const response = await fetch(`${API_BASE_URL}/api/generate-from-youtube`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: url,
      number_of_cards: numberOfCards,
    }),
  });

  return await handleResponse(response);
}

export async function generateFromPDF(file, numberOfCards = 5) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("number_of_cards", numberOfCards);

  const response = await fetch(`${API_BASE_URL}/api/generate-from-pdf`, {
    method: "POST",
    body: formData,
  });

  return await handleResponse(response);
}