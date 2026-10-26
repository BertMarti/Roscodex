import type { Difficulty } from "./game";
import { readStorage, STORAGE_KEYS, writeStorage } from "./storage";

export interface DifficultyRecord { bestScore: number; bestCorrect: number; games: number; }

function validRecord(value: unknown): value is DifficultyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value)
    && typeof (value as DifficultyRecord).bestScore === "number" && Number.isFinite((value as DifficultyRecord).bestScore)
    && typeof (value as DifficultyRecord).bestCorrect === "number" && Number.isFinite((value as DifficultyRecord).bestCorrect)
    && typeof (value as DifficultyRecord).games === "number" && Number.isFinite((value as DifficultyRecord).games);
}

export type RecordKind = "timed" | "blitz";
export function loadRecords(kind: RecordKind = "timed"): Partial<Record<Difficulty, DifficultyRecord>> {
  try {
    const parsed: unknown = JSON.parse(readStorage(kind === "blitz" ? STORAGE_KEYS.blitzRecords : STORAGE_KEYS.records) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Partial<Record<Difficulty, DifficultyRecord>> = {};
    for (const difficulty of ["beginner", "normal", "hard", "extreme"] as Difficulty[]) {
      const value = (parsed as Record<string, unknown>)[difficulty];
      if (validRecord(value)) result[difficulty] = value;
    }
    return result;
  } catch { return {}; }
}

export function registerResult(difficulty: Difficulty, score: number, correct: number, kind: RecordKind = "timed"): { record: DifficultyRecord; isNewRecord: boolean; previousBest: number | null } {
  const records = loadRecords(kind);
  const previous = records[difficulty];
  const previousBest = previous?.bestScore ?? null;
  const isNewRecord = previous ? score > previous.bestScore : score > 0;
  const record: DifficultyRecord = {
    bestScore: Math.max(previous?.bestScore ?? 0, score),
    bestCorrect: Math.max(previous?.bestCorrect ?? 0, correct),
    games: (previous?.games ?? 0) + 1
  };
  records[difficulty] = record;
  writeStorage(kind === "blitz" ? STORAGE_KEYS.blitzRecords : STORAGE_KEYS.records, JSON.stringify(records));
  return { record, isNewRecord, previousBest };
}
