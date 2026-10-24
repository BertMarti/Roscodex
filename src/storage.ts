export const STORAGE_KEYS = {
  questionHistory: "roscodex-question-history-v4",
  audio: "roscodex-audio",
  onboarding: "roscodex-onboarding-v1",
  practice: "roscodex-practice-v1",
  records: "roscodex-records-v1"
} as const;

export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* El juego sigue funcionando sin almacenamiento. */ }
}
