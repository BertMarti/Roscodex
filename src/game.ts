import { STORAGE_KEYS } from "./storage";

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type Difficulty = "beginner" | "normal" | "hard" | "extreme";
export type QuestionRule = "starts_with" | "contains";
export type RoscoStatus = "pending" | "active" | "correct" | "wrong" | "passed" | "expired";

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  letter: string;
  rule: QuestionRule;
  question: string;
  options: AnswerOption[];
  correctOptionId: string;
  explanation?: string;
}

export interface QuestionPack {
  id: string;
  difficulty: Difficulty;
  questions: Question[];
}

export const difficultyConfig: Record<Difficulty, { label: string; seconds: number; description: string }> = {
  beginner: { label: "PRINCIPIANTE", seconds: 360, description: "6:00 · Ruta inicial" },
  normal: { label: "NORMAL", seconds: 300, description: "5:00 · Buen ritmo" },
  hard: { label: "DIFÍCIL", seconds: 240, description: "4:00 · Sin despistes" },
  extreme: { label: "EXTREMO", seconds: 180, description: "3:00 · Liga máxima" }
};

const QUESTION_HISTORY_KEY = STORAGE_KEYS.questionHistory;
// Nombre antiguo del proyecto: se lee una vez para migrar y se borra al guardar (origen compartido con otras webs).
const LEGACY_QUESTION_HISTORY_KEY = "pokereto-question-history-v3";

export class QuestionBankExhaustedError extends Error {
  difficulty: Difficulty;

  constructor(difficulty: Difficulty) {
    super(`No quedan preguntas nuevas para ${difficulty}`);
    this.name = "QuestionBankExhaustedError";
    this.difficulty = difficulty;
  }
}

export interface SelectedPack extends QuestionPack {
  questions: Question[];
}

export function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [items[index], items[target]] = [items[target], items[index]];
  }
  return items;
}

export function isDifficulty(value: string): value is Difficulty {
  return Object.prototype.hasOwnProperty.call(difficultyConfig, value);
}

export function loadQuestionHistory(): Record<Difficulty, string[]> {
  try {
    const stored = localStorage.getItem(QUESTION_HISTORY_KEY) || localStorage.getItem(LEGACY_QUESTION_HISTORY_KEY) || "{}";
    const parsed: unknown = JSON.parse(stored);
    const valid = {} as Record<Difficulty, string[]>;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return valid;
    // Se descarta lo que no tenga la forma esperada (dificultad conocida → lista de IDs) sin perder el resto.
    for (const [key, value] of Object.entries(parsed)) {
      if (isDifficulty(key) && Array.isArray(value) && value.every((item) => typeof item === "string")) valid[key] = value;
    }
    return valid;
  } catch {
    return {} as Record<Difficulty, string[]>;
  }
}

export function saveQuestionHistory(history: Record<Difficulty, string[]>): void {
  try {
    localStorage.setItem(QUESTION_HISTORY_KEY, JSON.stringify(history));
    localStorage.removeItem(LEGACY_QUESTION_HISTORY_KEY);
  } catch {
    // El juego sigue funcionando aunque el navegador bloquee el almacenamiento local.
  }
}

/** persistHistory = false: elige sin repetir pero no apunta las preguntas en el historial (partida guiada). */
export function choosePack(packs: QuestionPack[], difficulty: Difficulty, persistHistory = true): SelectedPack {
  const matchingPack = packs.find((pack) => pack.difficulty === difficulty);
  if (!matchingPack) throw new Error(`No existe un banco para la dificultad ${difficulty}`);

  const history = [...(loadQuestionHistory()[difficulty] || [])];
  const canSelectWithoutRepeating = LETTERS.every((letter) => matchingPack.questions.some(
    (question) => question.letter === letter && !history.includes(question.id)
  ));

  if (!canSelectWithoutRepeating) throw new QuestionBankExhaustedError(difficulty);

  const selectedQuestions = LETTERS.map((letter) => {
    const candidates = matchingPack.questions.filter((question) => question.letter === letter && !history.includes(question.id));
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    if (!selected) throw new Error(`No quedan preguntas para la letra ${letter} en ${difficulty}`);
    history.push(selected.id);
    // Se barajan una sola vez por partida: el orden en pantalla y los atajos 1–4 coinciden siempre.
    return { ...selected, options: shuffle(selected.options.map((option) => ({ ...option }))) };
  });

  if (persistHistory) {
    const completeHistory = loadQuestionHistory();
    completeHistory[difficulty] = history;
    saveQuestionHistory(completeHistory);
  }
  return { ...matchingPack, id: `${matchingPack.id}-${Date.now()}`, questions: selectedQuestions };
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function explanationFor(question: Question): string | null {
  if (typeof question.explanation !== "string") return null;
  const explanation = question.explanation.trim();
  return explanation.length >= 1 && explanation.length <= 240 ? explanation : null;
}

export async function loadQuestionPacks(): Promise<QuestionPack[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/question-bank.json`);
  if (!response.ok) throw new Error("No se pudo cargar el banco local");
  const data = await response.json() as { packs: QuestionPack[] };
  return data.packs;
}

export function emptyStatuses(): Record<string, RoscoStatus> {
  return Object.fromEntries(LETTERS.map((letter) => [letter, "pending"])) as Record<string, RoscoStatus>;
}
