import type { GameState } from "./gameState";

export type TutorialTip = "rosco" | "answer" | "pass" | "round2";
export const tutorialTips: Record<TutorialTip, { title: string; text: string }> = {
  rosco: { title: "El rosco", text: "Cada letra es una pregunta; la amarilla es la actual; la respuesta empieza por esa letra (o la contiene si lo indica)." },
  answer: { title: "Responder", text: "Toca una de las 4 opciones o pulsa 1, 2, 3 o 4 en el teclado. Acierto = +10 puntos." },
  pass: { title: "Pasapalabra", text: "Si no la sabes, toca Pasapalabra o pulsa P: la letra se queda para la segunda vuelta." },
  round2: { title: "Segunda vuelta", text: "Vuelven las letras que pasaste; si vuelves a pasar, se quedan sin contestar. Con reloj, la partida acaba al terminar el tiempo." }
};

export function currentTip(game: GameState | null, acknowledged: ReadonlySet<TutorialTip>): TutorialTip | null {
  if (!game || game.finished) return null;
  if (!acknowledged.has("rosco")) return "rosco";
  if (!acknowledged.has("answer") && game.correct + game.wrong === 0) return "answer";
  if (!acknowledged.has("pass") && game.passed === 0 && game.round === 1) return "pass";
  if (game.round === 2 && !acknowledged.has("round2")) return "round2";
  return null;
}
