const difficultyConfig = {
  beginner: { label: "PRINCIPIANTE", seconds: 360 },
  normal: { label: "NORMAL", seconds: 300 },
  hard: { label: "DIFÍCIL", seconds: 240 },
  extreme: { label: "EXTREMO", seconds: 180 }
};

class QuestionBankExhaustedError extends Error {
  constructor(difficulty) {
    super(`No quedan preguntas nuevas para ${difficulty}`);
    this.name = "QuestionBankExhaustedError";
    this.difficulty = difficulty;
  }
}

const state = {
  questions: [],
  questionPacks: [],
  questionHistory: loadQuestionHistory(),
  currentPack: null,
  difficulty: "normal",
  queue: [],
  deferred: [],
  current: null,
  round: 1,
  score: 0,
  correct: 0,
  wrong: 0,
  passed: 0,
  statuses: {},
  endAt: 0,
  timerId: null,
  transitionId: null,
  acceptingInput: false,
  finished: false,
  finishReason: null
};

const elements = {
  home: document.querySelector("#home-screen"),
  game: document.querySelector("#game-screen"),
  rosco: document.querySelector("#rosco"),
  timer: document.querySelector("#timer"),
  timerBox: document.querySelector(".timer-box"),
  difficultyLabel: document.querySelector("#game-difficulty-label"),
  roundLabel: document.querySelector("#round-label"),
  score: document.querySelector("#score"),
  rule: document.querySelector("#question-rule"),
  question: document.querySelector("#question-text"),
  answers: document.querySelector("#answers"),
  pass: document.querySelector("#pass-button"),
  feedback: document.querySelector("#feedback"),
  creditsModal: document.querySelector("#credits-modal"),
  bankExhaustedModal: document.querySelector("#bank-exhausted-modal"),
  resultsModal: document.querySelector("#results-modal"),
  finalScore: document.querySelector("#final-score"),
  finalCorrect: document.querySelector("#final-correct"),
  finalWrong: document.querySelector("#final-wrong"),
  finalPassed: document.querySelector("#final-passed"),
  resultsTitle: document.querySelector("#results-title")
};

renderSpriteField();

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.difficulty));
});

document.querySelector("#open-credits").addEventListener("click", () => openModal(elements.creditsModal));
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal-backdrop"))));
document.querySelector("#restart-button").addEventListener("click", () => {
  closeModal(elements.resultsModal);
  startGame(state.difficulty);
});
document.querySelector("#home-button").addEventListener("click", () => {
  closeModal(elements.resultsModal);
  showHome();
});
document.querySelector("#exhausted-home-button").addEventListener("click", () => {
  closeModal(elements.bankExhaustedModal);
  showHome();
});
document.querySelector("#reset-bank-button").addEventListener("click", () => {
  state.questionHistory[state.difficulty] = [];
  saveQuestionHistory(state.questionHistory);
  closeModal(elements.bankExhaustedModal);
  startGame(state.difficulty);
});
elements.pass.addEventListener("click", passQuestion);

document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeModal(backdrop);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll(".modal-backdrop:not([hidden])").forEach(closeModal);
});

function renderSpriteField() {
  const field = document.querySelector("#sprite-field");
  for (let id = 1; id <= 25; id += 1) {
    const tile = document.createElement("div");
    tile.className = "sprite-tile";
    const image = document.createElement("img");
    image.src = `assets/sprites/${id.toString().padStart(3, "0")}.png`;
    image.alt = "";
    image.loading = "eager";
    tile.appendChild(image);
    field.appendChild(tile);
  }
}

async function startGame(difficulty) {
  clearTimeout(state.transitionId);
  clearInterval(state.timerId);
  state.difficulty = difficulty;
  state.queue = [];
  state.deferred = [];
  state.current = null;
  state.round = 1;
  state.score = 0;
  state.correct = 0;
  state.wrong = 0;
  state.passed = 0;
  state.statuses = {};
  state.acceptingInput = false;
  state.finished = false;
  state.finishReason = null;

  if (!state.questionPacks.length) {
    try {
      const bankResponse = await fetch("data/question-bank.json");
      if (bankResponse.ok) {
        const bankData = await bankResponse.json();
        state.questionPacks = bankData.packs;
      } else {
        const baseResponse = await fetch("data/questions.json");
        if (!baseResponse.ok) throw new Error("No se pudo cargar el banco local");
        const baseQuestions = await baseResponse.json();
        const packsResponse = await fetch("data/question-packs.json");
        if (!packsResponse.ok) throw new Error("No se pudo cargar los packs alternativos");
        const packData = await packsResponse.json();
        state.questionPacks = [
          { id: "beginner-001", difficulty: "beginner", questions: baseQuestions },
          ...packData.packs
        ];
      }
    } catch (error) {
      elements.question.textContent = "No se pudo cargar el pack local. Ejecuta la demo con un servidor HTTP.";
      console.error(error);
      return;
    }
  }

  const config = difficultyConfig[difficulty];
  try {
    state.currentPack = choosePack(difficulty);
  } catch (error) {
    if (error instanceof QuestionBankExhaustedError) {
      elements.game.hidden = true;
      elements.home.hidden = false;
      openModal(elements.bankExhaustedModal);
      return;
    }
    elements.question.textContent = "No se pudo seleccionar un rosco local.";
    console.error(error);
    return;
  }
  state.questions = state.currentPack.questions.map((question) => ({
    ...question,
    options: question.options.map((option) => ({ ...option }))
  }));
  state.queue = state.questions.map((_, index) => index);
  state.questions.forEach((question) => { state.statuses[question.letter] = "pending"; });
  state.endAt = Date.now() + config.seconds * 1000;
  elements.difficultyLabel.textContent = config.label;
  elements.home.hidden = true;
  elements.game.hidden = false;
  renderRosco();
  tick();
  state.timerId = setInterval(tick, 250);
  nextQuestion();
}

function choosePack(difficulty) {
  const matchingPack = state.questionPacks.find((pack) => pack.difficulty === difficulty);
  if (!matchingPack) throw new Error(`No existe un banco para la dificultad ${difficulty}`);
  let history = state.questionHistory[difficulty] || [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const canSelectWithoutRepeating = letters.every((letter) => matchingPack.questions.some((question) => question.letter === letter && !history.includes(question.id)));

  if (!canSelectWithoutRepeating) throw new QuestionBankExhaustedError(difficulty);

  const selectedQuestions = letters.map((letter) => {
    const candidates = matchingPack.questions.filter((question) => question.letter === letter && !history.includes(question.id));
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (!selected) throw new Error(`No quedan preguntas disponibles para la letra ${letter} en ${difficulty}`);
    history.push(selected.id);
    return selected;
  });

  state.questionHistory[difficulty] = history;
  saveQuestionHistory(state.questionHistory);
  return { ...matchingPack, id: `${matchingPack.id}-${Date.now()}`, questions: selectedQuestions };
}

function loadQuestionHistory() {
  try {
    return JSON.parse(localStorage.getItem("pokereto-question-history-v3") || "{}");
  } catch {
    return {};
  }
}

function saveQuestionHistory(history) {
  try {
    localStorage.setItem("pokereto-question-history-v3", JSON.stringify(history));
  } catch {
    // La demo sigue funcionando aunque el navegador bloquee el almacenamiento local.
  }
}

function nextQuestion() {
  if (state.finished) return;
  if (Date.now() >= state.endAt) return finishGame("time");

  if (!state.queue.length) {
    if (state.deferred.length && state.round === 1) {
      state.queue = [...state.deferred];
      state.deferred = [];
      state.round = 2;
    } else {
      return finishGame();
    }
  }

  const index = state.queue.shift();
  const question = state.questions[index];
  state.current = question;
  state.statuses[question.letter] = "active";
  state.acceptingInput = true;
  elements.roundLabel.textContent = `VUELTA ${state.round} · LETRA ${question.letter}`;
  elements.rule.textContent = question.rule === "contains" ? `CONTIENE LA LETRA ${question.letter}` : `EMPIEZA POR LA LETRA ${question.letter}`;
  elements.question.textContent = question.question;
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback";
  elements.answers.innerHTML = "";
  shuffle([...question.options]).forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.dataset.optionId = option.id;
    button.textContent = option.text;
    button.addEventListener("click", () => answerQuestion(option.id, button));
    elements.answers.appendChild(button);
  });
  elements.pass.disabled = false;
  renderRosco();
}

function answerQuestion(optionId, clickedButton) {
  if (!state.acceptingInput || !state.current) return;
  state.acceptingInput = false;
  elements.pass.disabled = true;
  const isCorrect = optionId === state.current.correctOptionId;
  const buttons = [...elements.answers.querySelectorAll(".answer-button")];
  buttons.forEach((button) => { button.disabled = true; });
  clickedButton.classList.add(isCorrect ? "is-correct" : "is-wrong");

  if (!isCorrect) {
    const correct = state.current.options.find((option) => option.id === state.current.correctOptionId);
    const correctButton = buttons.find((button) => button.dataset.optionId === correct.id);
    if (correctButton) correctButton.classList.add("is-correct");
  }

  state.statuses[state.current.letter] = isCorrect ? "correct" : "wrong";
  if (isCorrect) {
    state.correct += 1;
    state.score += 10;
    showFeedback("✓ ¡Correcto! +10 puntos", "is-correct");
  } else {
    state.wrong += 1;
    showFeedback(`✕ Era ${state.current.options.find((option) => option.id === state.current.correctOptionId).text}`, "is-wrong");
  }
  updateScore();
  renderRosco();
  scheduleNext();
}

function passQuestion() {
  if (!state.acceptingInput || !state.current) return;
  state.acceptingInput = false;
  elements.pass.disabled = true;
  [...elements.answers.querySelectorAll(".answer-button")].forEach((button) => { button.disabled = true; });
  state.statuses[state.current.letter] = "passed";
  if (state.round === 1) state.deferred.push(state.questions.indexOf(state.current));
  state.passed += 1;
  showFeedback("↻ Pasapalabra — volveremos a esta letra", "is-passed");
  renderRosco();
  scheduleNext();
}

function scheduleNext() {
  clearTimeout(state.transitionId);
  state.transitionId = setTimeout(nextQuestion, 850);
}

function tick() {
  const remaining = Math.max(0, state.endAt - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  elements.timer.textContent = `${minutes}:${rest}`;
  elements.timerBox.classList.toggle("is-danger", seconds <= 30);
  if (remaining <= 0 && !elements.game.hidden) finishGame("time");
}

function finishGame(reason = "complete") {
  if (state.finished) return;
  state.finished = true;
  state.finishReason = reason;
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);
  state.acceptingInput = false;
  elements.pass.disabled = true;
  if (state.current && state.statuses[state.current.letter] === "active") {
    state.statuses[state.current.letter] = "expired";
  }
  renderRosco();
  elements.finalScore.textContent = state.score;
  elements.finalCorrect.textContent = state.correct;
  elements.finalWrong.textContent = state.wrong;
  elements.finalPassed.textContent = state.passed;
  elements.resultsTitle.textContent = reason === "time" ? "Tiempo agotado" : "Reto completado";
  openModal(elements.resultsModal);
}

function renderRosco() {
  elements.rosco.innerHTML = "";
  const letters = state.questions.length ? state.questions.map((question) => question.letter) : "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  letters.forEach((letter, index) => {
    const angle = (index / letters.length) * Math.PI * 2 - Math.PI / 2;
    const radius = window.matchMedia("(max-width: 410px)").matches ? 43 : 46;
    const node = document.createElement("div");
    node.className = `rosco-letter is-${state.statuses[letter] || "pending"}`;
    node.innerHTML = `<span class="rosco-letter__glyph">${letter}</span>`;
    node.setAttribute("aria-label", `${letter}: ${state.statuses[letter] || "pendiente"}`);
    node.style.left = `${50 + Math.cos(angle) * radius}%`;
    node.style.top = `${50 + Math.sin(angle) * radius}%`;
    elements.rosco.appendChild(node);
  });
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

function updateScore() { elements.score.textContent = state.score; }
function showFeedback(message, className) { elements.feedback.textContent = message; elements.feedback.className = `feedback ${className}`; }
function openModal(modal) { modal.hidden = false; }
function closeModal(modal) { if (modal) modal.hidden = true; }
function showHome() {
  clearInterval(state.timerId);
  clearTimeout(state.transitionId);
  elements.game.hidden = true;
  elements.home.hidden = false;
}
