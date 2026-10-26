import { readStorage, STORAGE_KEYS, writeStorage } from "./storage";
export type ContrastPreference = "auto" | "on" | "off";
export function parseContrast(raw: string | null): ContrastPreference { return raw === "on" || raw === "off" || raw === "auto" ? raw : "auto"; }
export function loadContrast(): ContrastPreference { return parseContrast(readStorage(STORAGE_KEYS.contrast)); }
export function saveContrast(preference: ContrastPreference): void { writeStorage(STORAGE_KEYS.contrast, preference); }
export function systemPrefersMoreContrast(): boolean { try { return typeof window.matchMedia === "function" && window.matchMedia("(prefers-contrast: more)").matches; } catch { return false; } }
export function isHighContrast(preference: ContrastPreference, system: boolean): boolean { return preference === "on" || preference === "auto" && system; }
export function applyContrast(high: boolean): void { document.documentElement.dataset.contrast = high ? "high" : "normal"; }
