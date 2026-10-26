export const STORAGE_KEYS = {
  questionHistory: "roscodex-question-history-v4",
  audio: "roscodex-audio",
  onboarding: "roscodex-onboarding-v1",
  practice: "roscodex-practice-v1",
  playMode: "roscodex-play-mode-v1",
  records: "roscodex-records-v1",
  blitzRecords: "roscodex-blitz-records-v1",
  stats: "roscodex-stats-v1",
  contrast: "roscodex-contrast-v1"
} as const;

export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* El juego sigue funcionando sin almacenamiento. */ }
}

export function removeStorage(key: string): void {
  try { localStorage.removeItem(key); } catch { /* El juego sigue funcionando sin almacenamiento. */ }
}

export type PlayModePreference = "timed" | "blitz" | "practice";
export function parsePlayMode(raw: string | null, legacy: string | null): PlayModePreference {
  if (raw === "timed" || raw === "blitz" || raw === "practice") return raw;
  return legacy === "on" ? "practice" : "timed";
}
