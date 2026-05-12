import {
  generateFromText,
  generateFromURL,
  generateFromYouTube,
  generateFromPDF,
} from "./api.js";

const tabButtons = document.querySelectorAll(".tab-btn");
const inputContainer = document.getElementById("inputContainer");
const generateBtn = document.getElementById("generateBtn");
const outputContainer = document.getElementById("outputContainer");

let activeTab = "text";

let currentFlashcards = [];
let currentFlashcardIndex = 0;
let isAnswerRevealed = false;

const smallInputClasses =
  "w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-3 text-sm text-white placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-400/30 sm:px-4 sm:text-base";

const textAreaClasses =
  "min-h-[160px] w-full resize-none rounded-lg border border-slate-500 bg-slate-700 px-3 py-3 text-sm text-white placeholder:text-slate-300 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-400/30 sm:min-h-[180px] sm:px-4 sm:text-base lg:min-h-[150px]";

const fileInputClasses =
  "w-full rounded-lg border border-slate-500 bg-slate-700 px-3 py-3 text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-white hover:file:bg-slate-900 outline-none transition-all duration-200 focus:border-slate-300 focus:ring-2 focus:ring-slate-400/30 sm:px-4 sm:text-base";

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInputByTab(tab) {
  const cardsInputHTML = `
    <input
      id="numberOfCardsInput"
      type="number"
      min="1"
      value="10"
      placeholder="Number of flashcards"
      class="${smallInputClasses}"
    >
  `;

  if (tab === "text") {
    inputContainer.innerHTML = `
      <textarea
        id="sourceInput"
        placeholder="Enter your raw text"
        class="${textAreaClasses}"
      ></textarea>

      ${cardsInputHTML}
    `;
  }

  if (tab === "url") {
    inputContainer.innerHTML = `
      <input
        id="sourceInput"
        type="url"
        placeholder="Enter article URL"
        class="${smallInputClasses}"
      >

      ${cardsInputHTML}
    `;
  }

  if (tab === "youtube") {
    inputContainer.innerHTML = `
      <input
        id="sourceInput"
        type="url"
        placeholder="Enter YouTube video URL"
        class="${smallInputClasses}"
      >

      ${cardsInputHTML}
    `;
  }

  if (tab === "pdf") {
    inputContainer.innerHTML = `
      <input
        id="sourceInput"
        type="file"
        accept=".pdf,application/pdf"
        class="${fileInputClasses}"
      >

      ${cardsInputHTML}
    `;
  }
}

function setActiveTab(tab) {
  activeTab = tab;

  tabButtons.forEach((button) => {
    button.classList.remove("bg-slate-500");
    button.classList.add("bg-slate-600");

    if (button.dataset.tab === tab) {
      button.classList.remove("bg-slate-600");
      button.classList.add("bg-slate-500");
    }
  });

  renderInputByTab(tab);
}

function renderLoading() {
  outputContainer.innerHTML = `
    <div class="flex h-full min-h-[380px] items-center justify-center text-center text-slate-200">
      Generating study material...
    </div>
  `;
}

function renderError(message) {
  outputContainer.innerHTML = `
    <div class="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100 sm:text-base">
      ${escapeHTML(message)}
    </div>
  `;
}

function renderFlashcardCarousel() {
  const carouselContainer = document.getElementById("flashcardCarousel");

  if (!carouselContainer) return;

  if (!currentFlashcards.length) {
    carouselContainer.innerHTML = `
      <p class="text-slate-300">No flashcards returned.</p>
    `;
    return;
  }

  const card = currentFlashcards[currentFlashcardIndex];

  carouselContainer.innerHTML = `
    <div class="rounded-lg border border-slate-500 bg-slate-800/70 p-4 sm:p-6">
      <div class="mb-5 flex items-center justify-between gap-3 sm:gap-4">
        <button
          data-action="prev-card"
          class="rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-base transition hover:bg-slate-600 active:scale-95 sm:px-4 sm:text-lg"
        >
          &lt;
        </button>

        <div class="text-center">
          <h3 class="text-sm font-semibold sm:text-base">
            Card ${currentFlashcardIndex + 1} / ${currentFlashcards.length}
          </h3>

          <span class="mt-2 inline-block rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
            ${escapeHTML(card.difficulty || "unknown")}
          </span>
        </div>

        <button
          data-action="next-card"
          class="rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-base transition hover:bg-slate-600 active:scale-95 sm:px-4 sm:text-lg"
        >
          &gt;
        </button>
      </div>

      <button
        data-action="toggle-answer"
        class="min-h-[200px] w-full rounded-lg border border-slate-600 bg-slate-700/70 p-4 text-left transition hover:bg-slate-700 sm:min-h-[220px] sm:p-6"
      >
        <p class="mb-4 text-base text-slate-100 sm:text-lg">
          <span class="font-semibold">Q:</span>
          ${escapeHTML(card.question)}
        </p>

        ${
          isAnswerRevealed
            ? `
              <div class="mt-6 rounded-lg bg-slate-900/50 p-4 text-sm text-slate-200 sm:text-base">
                <span class="font-semibold text-slate-100">A:</span>
                ${escapeHTML(card.answer)}
              </div>
            `
            : `
              <div class="mt-6 rounded-lg border border-dashed border-slate-500 p-4 text-center text-sm text-slate-300 sm:text-base">
                Click to reveal answer
              </div>
            `
        }
      </button>

      <div class="mt-4 flex flex-wrap gap-2">
        ${(card.tags || [])
          .map(
            (tag) => `
              <span class="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300">
                ${escapeHTML(tag)}
              </span>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function changeFlashcard(direction) {
  if (!currentFlashcards.length) return;

  currentFlashcardIndex += direction;

  if (currentFlashcardIndex < 0) {
    currentFlashcardIndex = currentFlashcards.length - 1;
  }

  if (currentFlashcardIndex >= currentFlashcards.length) {
    currentFlashcardIndex = 0;
  }

  isAnswerRevealed = false;
  renderFlashcardCarousel();
}

function renderResult(data) {
  const result = data.result;

  if (result.raw_response) {
    outputContainer.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-lg font-semibold sm:text-xl">Raw response</h2>
        <pre class="whitespace-pre-wrap rounded-lg bg-slate-800 p-4 text-xs text-slate-200 sm:text-sm">${escapeHTML(result.raw_response)}</pre>
      </div>
    `;
    return;
  }

  const summary = result.summary || "No summary returned.";
  const keyConcepts = result.key_concepts || [];
  const flashcards = result.flashcards || [];

  currentFlashcards = flashcards;
  currentFlashcardIndex = 0;
  isAnswerRevealed = false;

  outputContainer.innerHTML = `
    <div class="space-y-5 sm:space-y-6">
      <section class="rounded-lg bg-slate-800/70 p-4 sm:p-5">
        <h2 class="mb-2 text-lg font-semibold sm:text-xl">Summary</h2>
        <p class="text-sm leading-relaxed text-slate-200 sm:text-base">${escapeHTML(summary)}</p>
      </section>

      <section class="rounded-lg bg-slate-800/70 p-4 sm:p-5">
        <h2 class="mb-3 text-lg font-semibold sm:text-xl">Key Concepts</h2>

        <div class="flex flex-wrap gap-2">
          ${
            keyConcepts.length
              ? keyConcepts
                  .map(
                    (concept) => `
                      <span class="rounded-full border border-slate-500 bg-slate-700 px-3 py-1 text-xs text-slate-100 sm:text-sm">
                        ${escapeHTML(concept)}
                      </span>
                    `
                  )
                  .join("")
              : `<p class="text-sm text-slate-300 sm:text-base">No key concepts returned.</p>`
          }
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold sm:text-xl">Flashcards</h2>
        <div id="flashcardCarousel"></div>
      </section>
    </div>
  `;

  renderFlashcardCarousel();
}

async function handleGenerate() {
  const sourceInput = document.getElementById("sourceInput");
  const numberInput = document.getElementById("numberOfCardsInput");

  const numberOfCards = Number(numberInput.value) || 10;

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    generateBtn.classList.add("opacity-70", "cursor-not-allowed");
    renderLoading();

    let data;

    if (activeTab === "text") {
      const text = sourceInput.value.trim();

      if (!text) {
        throw new Error("Please enter raw text.");
      }

      data = await generateFromText(text, numberOfCards);
    }

    if (activeTab === "url") {
      const url = sourceInput.value.trim();

      if (!url) {
        throw new Error("Please enter a URL.");
      }

      data = await generateFromURL(url, numberOfCards);
    }

    if (activeTab === "youtube") {
      const url = sourceInput.value.trim();

      if (!url) {
        throw new Error("Please enter a YouTube URL.");
      }

      data = await generateFromYouTube(url, numberOfCards);
    }

    if (activeTab === "pdf") {
      const file = sourceInput.files[0];

      if (!file) {
        throw new Error("Please upload a PDF file.");
      }

      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are supported.");
      }

      data = await generateFromPDF(file, numberOfCards);
    }

    renderResult(data);
  } catch (error) {
    renderError(error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
    generateBtn.classList.remove("opacity-70", "cursor-not-allowed");
  }
}

outputContainer.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  const action = actionButton.dataset.action;

  if (action === "prev-card") {
    changeFlashcard(-1);
  }

  if (action === "next-card") {
    changeFlashcard(1);
  }

  if (action === "toggle-answer") {
    isAnswerRevealed = !isAnswerRevealed;
    renderFlashcardCarousel();
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

generateBtn.addEventListener("click", handleGenerate);

setActiveTab("text");