import type { GameState } from "./gameState";
import { LETTERS } from "./game";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "./storage";

export interface LetterStats { played: number; correct: number; }
export interface PlayerStats { games: number; correct: number; wrong: number; passed: number; bestStreak: number; byLetter: Record<string, LetterStats>; }
const MAX = 10_000_000;
const validNumber = (value: unknown) => typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value >= 0 && value <= MAX;
export function emptyStats(): PlayerStats { return { games: 0, correct: 0, wrong: 0, passed: 0, bestStreak: 0, byLetter: {} }; }
export function parseStats(raw: string | null): PlayerStats {
  const result = emptyStats();
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return result;
    const source = value as Record<string, unknown>;
    for (const key of ["games", "correct", "wrong", "passed", "bestStreak"] as const) if (validNumber(source[key])) result[key] = source[key] as number;
    if (source.byLetter && typeof source.byLetter === "object" && !Array.isArray(source.byLetter)) for (const letter of LETTERS) {
      const item = (source.byLetter as Record<string, unknown>)[letter];
      if (item && typeof item === "object" && validNumber((item as LetterStats).played) && validNumber((item as LetterStats).correct) && (item as LetterStats).correct <= (item as LetterStats).played) result.byLetter[letter] = { played: (item as LetterStats).played, correct: (item as LetterStats).correct };
    }
  } catch { /* Valor por defecto. */ }
  return result;
}
export function applyGame(stats: PlayerStats, game: GameState): PlayerStats {
  const next = parseStats(JSON.stringify(stats));
  next.games += 1; next.correct += game.correct; next.wrong += game.wrong; next.passed += game.passed; next.bestStreak = Math.max(next.bestStreak, game.bestStreak);
  for (const question of game.questions) { const status = game.statuses[question.letter]; if (status !== "correct" && status !== "wrong") continue; /* Solo cuentan las letras respondidas: pendientes o sin tiempo no. */ const item = next.byLetter[question.letter] ?? { played: 0, correct: 0 }; item.played += 1; if (status === "correct") item.correct += 1; next.byLetter[question.letter] = item; }
  return next;
}
export function accuracyPercent(correct: number, total: number): number | null { return total > 0 ? Math.round(correct / total * 100) : null; }
export function loadStats(): PlayerStats { return parseStats(readStorage(STORAGE_KEYS.stats)); }
export function recordGame(game: GameState): PlayerStats { const current = loadStats(); if (game.mode === "guided") return current; const next = applyGame(current, game); writeStorage(STORAGE_KEYS.stats, JSON.stringify(next)); return next; }
export function resetStats(): void { removeStorage(STORAGE_KEYS.stats); removeStorage(STORAGE_KEYS.records); removeStorage(STORAGE_KEYS.blitzRecords); }
