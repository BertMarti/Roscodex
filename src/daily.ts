import { LETTERS, type Difficulty, type Question, type QuestionPack } from "./game";
import type { GameState } from "./gameState";
import { readStorage, STORAGE_KEYS, writeStorage } from "./storage";
import { SHARE_URL } from "./share";

export const DAILY_DIFFICULTY: Difficulty = "normal";
export const DAILY_EPOCH = "2026-10-31";

export function localDateKey(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function dayIndex(key: string): number {
  if (!isDateKey(key)) throw new Error("Fecha no válida");
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}
export function dailyNumber(key: string): number { return dayIndex(key) - dayIndex(DAILY_EPOCH) + 1; }

export function seedFromKey(key: string): number {
  let hash = 0x811c9dc5;
  for (const character of `roscodex-daily:${key}`) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 0x01000193); }
  return hash >>> 0;
}
export function createRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => { value += 0x6d2b79f5; let result = value; result = Math.imul(result ^ result >>> 15, result | 1); result ^= result + Math.imul(result ^ result >>> 7, result | 61); return ((result ^ result >>> 14) >>> 0) / 4294967296; };
}

export function chooseDailyQuestions(packs: QuestionPack[], key: string): Question[] {
  if (!isDateKey(key)) throw new Error("Fecha del rosco no válida");
  const pack = packs.find((item) => item.difficulty === DAILY_DIFFICULTY);
  if (!pack) throw new Error(`No existe un banco para la dificultad ${DAILY_DIFFICULTY}`);
  const random = createRandom(seedFromKey(key));
  return LETTERS.map((letter) => {
    const candidates = pack.questions.filter((question) => question.letter === letter).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    if (!candidates.length) throw new Error(`No hay preguntas para la letra ${letter}`);
    const selected = candidates[Math.floor(random() * candidates.length)];
    const options = selected.options.map((option) => ({ ...option }));
    for (let index = options.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [options[index], options[target]] = [options[target], options[index]]; }
    return { ...selected, options };
  });
}

export function msUntilNextDay(now: Date): number { return Math.max(0, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()); }
export function formatCountdown(milliseconds: number): string { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor(seconds % 3600 / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }
export function describeCountdown(milliseconds: number): string { const minutes = Math.ceil(Math.max(0, milliseconds) / 60_000); if (minutes < 1) return "menos de 1 min"; const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? `${hours} h${rest ? ` y ${rest} min` : ""}` : `${minutes} min`; }

export type DailyCell = "correct" | "wrong" | "passed" | "empty";
export interface DailyResult { date: string; number: number; cells: DailyCell[]; score: number; correct: number; wrong: number; passed: number; finished: boolean; }
export interface DailyHistoryEntry { date: string; number: number; correct: number; wrong: number; passed: number; score: number; finished: boolean; }
export const DAILY_HISTORY_LIMIT = 400;
export interface DailyData { lastDate: string | null; streak: number; bestStreak: number; result: DailyResult | null; history: DailyHistoryEntry[]; }
const cells: DailyCell[] = ["correct", "wrong", "passed", "empty"];
const validInteger = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
// Origen compartido: otra web podría escribir la clave. Los contadores deben cuadrar con las casillas y el número con la fecha.
function consistentResult(date: string, number: number, values: DailyCell[], correct: number, wrong: number, passed: number): boolean {
  const count = (cell: DailyCell) => values.filter((value) => value === cell).length;
  return number >= 1 && number === dailyNumber(date) && correct === count("correct") && wrong === count("wrong") && passed >= count("passed") && passed <= 1_000;
}
export function emptyDaily(): DailyData { return { lastDate: null, streak: 0, bestStreak: 0, result: null, history: [] }; }

function historyEntryFromResult(result: DailyResult): DailyHistoryEntry { return { date: result.date, number: result.number, correct: result.correct, wrong: result.wrong, passed: result.passed, score: result.score, finished: result.finished }; }
function validHistoryEntry(value: unknown): value is DailyHistoryEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return isDateKey(item.date) && typeof item.number === "number" && item.number >= 1 && item.number === dailyNumber(item.date) &&
    [item.correct, item.wrong, item.passed, item.score].every((number) => validInteger(number)) &&
    (item.correct as number) + (item.wrong as number) <= 26 && (item.passed as number) <= 1000 &&
    typeof item.finished === "boolean";
}
export function upsertDailyHistory(history: DailyHistoryEntry[], result: DailyHistoryEntry): DailyHistoryEntry[] {
  const next = history.filter((entry) => entry.date !== result.date).concat(result).sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-DAILY_HISTORY_LIMIT);
}
export function parseDaily(raw: string | null): DailyData {
  const result = emptyDaily();
  try {
    const source: unknown = JSON.parse(raw ?? "null");
    if (!source || typeof source !== "object" || Array.isArray(source)) return result;
    const value = source as Record<string, unknown>;
    if (value.lastDate === null || isDateKey(value.lastDate)) result.lastDate = value.lastDate as string | null;
    if (validInteger(value.streak)) result.streak = value.streak as number;
    if (validInteger(value.bestStreak)) result.bestStreak = value.bestStreak as number;
    const rawResult = value.result;
    if (rawResult && typeof rawResult === "object" && !Array.isArray(rawResult)) {
      const item = rawResult as Record<string, unknown>;
      if (isDateKey(item.date) && validInteger(item.number) && Array.isArray(item.cells) && item.cells.length === 26 && item.cells.every((cell) => cells.includes(cell as DailyCell)) && validInteger(item.score) && validInteger(item.correct) && validInteger(item.wrong) && validInteger(item.passed) && typeof item.finished === "boolean"
        && consistentResult(item.date, item.number as number, item.cells as DailyCell[], item.correct as number, item.wrong as number, item.passed as number)) result.result = { date: item.date, number: item.number as number, cells: [...item.cells] as DailyCell[], score: item.score as number, correct: item.correct as number, wrong: item.wrong as number, passed: item.passed as number, finished: item.finished };
    }
    if (Array.isArray(value.history)) {
      const entries = value.history.filter(validHistoryEntry).map((entry) => ({ date: entry.date, number: entry.number, correct: entry.correct, wrong: entry.wrong, passed: entry.passed, score: entry.score, finished: entry.finished }));
      result.history = entries.reduce<DailyHistoryEntry[]>((all, entry) => upsertDailyHistory(all, entry), []);
    } else if (result.result) {
      result.history = [historyEntryFromResult(result.result)];
    }
  } catch { /* Se usa el valor por defecto. */ }
  return result;
}
export function loadDaily(): DailyData { return parseDaily(readStorage(STORAGE_KEYS.daily)); }
export function saveDaily(data: DailyData): void { writeStorage(STORAGE_KEYS.daily, JSON.stringify(data)); }
export function cellsFromGame(game: GameState): DailyCell[] { return LETTERS.map((letter) => game.statuses[letter] === "correct" ? "correct" : game.statuses[letter] === "wrong" ? "wrong" : game.statuses[letter] === "passed" ? "passed" : "empty"); }
export function startDaily(data: DailyData, todayKey: string): DailyData { const streak = data.lastDate === todayKey ? data.streak : data.lastDate && dayIndex(todayKey) - dayIndex(data.lastDate) === 1 ? data.streak + 1 : 1; const result: DailyResult = { date: todayKey, number: dailyNumber(todayKey), cells: LETTERS.map(() => "empty"), score: 0, correct: 0, wrong: 0, passed: 0, finished: false }; return { lastDate: todayKey, streak, bestStreak: Math.max(data.bestStreak, streak), result, history: upsertDailyHistory(data.history, historyEntryFromResult(result)) }; }
export function updateDailyProgress(data: DailyData, game: GameState, finished: boolean): DailyData { if (game.mode !== "daily" || !data.result) return data; const result = { ...data.result, cells: cellsFromGame(game), score: game.score, correct: game.correct, wrong: game.wrong, passed: game.passed, finished }; return { ...data, result, history: upsertDailyHistory(data.history, historyEntryFromResult(result)) }; }
export function hasPlayedToday(data: DailyData, todayKey: string): boolean { return data.result?.date === todayKey; }
export function currentStreak(data: DailyData, todayKey: string): number { return data.lastDate && (data.lastDate === todayKey || dayIndex(todayKey) - dayIndex(data.lastDate) === 1) ? data.streak : 0; }
export function resetDailyStats(data: DailyData, todayKey: string): DailyData { return { ...data, history: [], bestStreak: currentStreak(data, todayKey) }; }
export interface DailySummary { played: number; finished: number; averageCorrect: number | null; bestCorrect: number | null; bestScore: number | null; distribution: { label: string; min: number; max: number; count: number }[]; }
export function summarizeDailyHistory(history: DailyHistoryEntry[]): DailySummary {
  const distribution = [{ label: "0–5", min: 0, max: 5 }, { label: "6–10", min: 6, max: 10 }, { label: "11–15", min: 11, max: 15 }, { label: "16–20", min: 16, max: 20 }, { label: "21–25", min: 21, max: 25 }, { label: "26", min: 26, max: 26 }].map((range) => ({ ...range, count: history.filter((entry) => entry.correct >= range.min && entry.correct <= range.max).length }));
  return { played: history.length, finished: history.filter((entry) => entry.finished).length, averageCorrect: history.length ? Math.round(history.reduce((sum, entry) => sum + entry.correct, 0) / history.length * 10) / 10 : null, bestCorrect: history.length ? Math.max(...history.map((entry) => entry.correct)) : null, bestScore: history.length ? Math.max(...history.map((entry) => entry.score)) : null, distribution };
}
export function recentDailyDays(history: DailyHistoryEntry[], todayKey: string, count = 28): { date: string; number: number; entry: DailyHistoryEntry | null }[] {
  if (!isDateKey(todayKey) || todayKey < DAILY_EPOCH || count <= 0) return [];
  const total = Math.min(Math.floor(count), dayIndex(todayKey) - dayIndex(DAILY_EPOCH) + 1);
  const byDate = new Map(history.map((entry) => [entry.date, entry]));
  return Array.from({ length: total }, (_, index) => { const date = new Date((dayIndex(todayKey) - total + index + 1) * 86_400_000); const key = `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`; return { date: key, number: dailyNumber(key), entry: byDate.get(key) ?? null }; });
}
export function buildDailyShareText(result: DailyResult, streak: number): string { const date = result.date.split("-").reverse().join("/"); const icon = (cell: DailyCell) => cell === "correct" ? "🟩" : cell === "wrong" ? "🟥" : cell === "passed" ? "🟦" : "⬜"; return [`Roscodex · Rosco del día #${result.number} · ${date}`, `✅ ${result.correct} · ❌ ${result.wrong} · ↻ ${result.passed} · 🏆 ${result.score} puntos`, result.cells.slice(0, 13).map(icon).join(""), result.cells.slice(13).map(icon).join(""), `🔥 Racha: ${streak} ${streak === 1 ? "día" : "días"}`, SHARE_URL].join("\n"); }
