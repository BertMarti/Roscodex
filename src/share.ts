import { difficultyConfig } from "./game";
import type { GameState } from "./gameState";
export const SHARE_URL = "https://bertmarti.github.io/Roscodex/";
export function buildShareText(game: GameState): string {
  const mode = game.mode === "blitz" ? "Contrarreloj" : game.mode === "practice" ? "Práctica" : "Con reloj";
  const cells = game.questions.map((question) => game.statuses[question.letter] === "correct" ? "🟩" : game.statuses[question.letter] === "wrong" ? "🟥" : "⬜").join("");
  return `Roscodex · ${difficultyConfig[game.difficulty].label} · ${mode}\n🏆 ${game.score} puntos · ✅ ${game.correct} · ❌ ${game.wrong} · ↻ ${game.passed}\n${cells}\n¿Me superas? ${SHARE_URL}`;
}
export async function shareResult(text: string, nav: Pick<Navigator, "share" | "clipboard"> | undefined = navigator): Promise<"shared" | "copied" | "cancelled" | "unavailable"> {
  try { if (nav?.share) { await nav.share({ title: "Roscodex", text }); return "shared"; } } catch (error) { if ((error as { name?: unknown } | null)?.name === "AbortError") return "cancelled"; }
  try { if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(text); return "copied"; } } catch { /* Se ofrece el texto manualmente. */ }
  return "unavailable";
}
