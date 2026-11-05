import { difficultyConfig, LETTERS } from "./game";
import type { GameState } from "./gameState";
import type { DailyCell, DailyResult } from "./daily";

export type ShareCell = DailyCell;
export interface ShareCardData { kicker: string; title: string; subtitle: string; score: number; cells: { letter: string; cell: ShareCell }[]; stats: { label: string; value: string; color?: string }[]; footer: string; fileName: string; }
export const SHARE_CARD_LOGICAL = 300;
export const SHARE_CARD_SCALE = 4;

const modeLabel = (game: GameState): string => game.mode === "blitz" ? "CONTRARRELOJ" : game.mode === "practice" ? "PRACTICA" : "CON RELOJ";
/** Press Start 2P pinta las mayúsculas acentuadas como minúsculas: en el lienzo van sin tilde (la Ñ se queda). Solo para la imagen, no para el DOM. */
export const canvasText = (text: string): string => text.replace(/[ÁÀÄÂ]/g, "A").replace(/[ÉÈËÊ]/g, "E").replace(/[ÍÌÏÎ]/g, "I").replace(/[ÓÒÖÔ]/g, "O").replace(/[ÚÙÜÛ]/g, "U");
const cellsForGame = (game: GameState): { letter: string; cell: ShareCell }[] => LETTERS.map((letter) => ({ letter, cell: game.statuses[letter] === "correct" ? "correct" : game.statuses[letter] === "wrong" ? "wrong" : game.statuses[letter] === "passed" ? "passed" : "empty" }));
const countStats = (counts: { correct: number; wrong: number; passed: number }) => [
  { label: "ACIERTOS", value: String(counts.correct), color: "#35cf78" },
  { label: "FALLOS", value: String(counts.wrong), color: "#ef5262" },
  { label: "PASADAS", value: String(counts.passed), color: "#5874ff" }
];
export const SHARE_CARD_FOOTER = "bertmarti.github.io/Roscodex";
export function dailyShareCard(result: DailyResult, streak: number): ShareCardData {
  return { kicker: "ROSCO DEL DIA", title: `#${result.number}`, subtitle: result.date.split("-").reverse().join("/"), score: result.score, cells: result.cells.map((cell, index) => ({ letter: LETTERS[index], cell })), stats: [...countStats(result), { label: "RACHA", value: String(streak) }], footer: SHARE_CARD_FOOTER, fileName: `roscodex-rosco-del-dia-${result.number}.png` };
}
export function gameShareCard(game: GameState): ShareCardData {
  return { kicker: canvasText(difficultyConfig[game.difficulty].label), title: modeLabel(game), subtitle: "¿ME SUPERAS?", score: game.score, cells: cellsForGame(game), stats: countStats(game), footer: SHARE_CARD_FOOTER, fileName: "roscodex-resultado.png" };
}

export interface ShareCanvasContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  imageSmoothingEnabled: boolean;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
}

const COLORS: Record<ShareCell, string> = { correct: "#35cf78", wrong: "#ef5262", passed: "#5874ff", empty: "#3c4150" };
const font = (size: number) => `${size}px "Press Start 2P", monospace`;
const RING = { x: 150, y: 158, radius: 78, cell: 16 } as const;

/** Posición (esquina superior izquierda, en píxeles lógicos enteros) de la casilla `index` del rosco: la A arriba y en sentido horario. */
export function ringCellPosition(index: number, total = 26): { x: number; y: number } {
  const angle = -Math.PI / 2 + index / total * Math.PI * 2;
  return { x: Math.round(RING.x + Math.cos(angle) * RING.radius - RING.cell / 2), y: Math.round(RING.y + Math.sin(angle) * RING.radius - RING.cell / 2) };
}

/** Pinta la tarjeta en un lienzo lógico de 300×300 escalado ×4, sin suavizado: pixel-art nítido y sin recursos externos. */
export function drawShareCard(ctx: ShareCanvasContext, data: ShareCardData): void {
  const size = SHARE_CARD_LOGICAL;
  ctx.save();
  ctx.scale(SHARE_CARD_SCALE, SHARE_CARD_SCALE);
  ctx.imageSmoothingEnabled = false;
  // Fondo con líneas de barrido, como la portada.
  ctx.fillStyle = "#080b17"; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#0e1428"; for (let y = 2; y < size; y += 4) ctx.fillRect(0, y, size, 1);
  // Marco pixelado de 2 px con las esquinas recortadas y un filete interior.
  ctx.fillStyle = "#ffcb05";
  ctx.fillRect(8, 4, size - 16, 2); ctx.fillRect(8, size - 6, size - 16, 2); ctx.fillRect(4, 8, 2, size - 16); ctx.fillRect(size - 6, 8, 2, size - 16);
  for (const [x, y] of [[6, 6], [size - 8, 6], [6, size - 8], [size - 8, size - 8]]) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = "#626679"; ctx.fillRect(10, 10, size - 20, 1); ctx.fillRect(10, size - 11, size - 20, 1); ctx.fillRect(10, 10, 1, size - 20); ctx.fillRect(size - 11, 10, 1, size - 20);
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  // Cabecera: logotipo con sombra dura, modo y fecha o reto.
  ctx.font = font(16); ctx.fillStyle = "#7a5f00"; ctx.fillText("ROSCODEX", 152, 18); ctx.fillStyle = "#ffcb05"; ctx.fillText("ROSCODEX", 150, 16);
  ctx.font = font(8); ctx.fillStyle = "#f7f7fa"; ctx.fillText(canvasText([data.kicker, data.title].filter(Boolean).join(" · ")), 150, 40);
  ctx.fillStyle = "#a7acbd"; ctx.fillText(canvasText(data.subtitle), 150, 52);
  // El rosco: 26 casillas en círculo con su letra.
  data.cells.forEach(({ letter, cell }, index) => {
    const { x, y } = ringCellPosition(index, data.cells.length);
    ctx.fillStyle = "#000000"; ctx.fillRect(x + 1, y + 1, RING.cell, RING.cell);
    ctx.fillStyle = COLORS[cell]; ctx.fillRect(x, y, RING.cell, RING.cell);
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)"; ctx.fillRect(x, y, RING.cell, 2);
    ctx.font = font(8); ctx.fillStyle = cell === "empty" ? "#f7f7fa" : "#080b17"; ctx.fillText(letter, x + 8, y + 4);
  });
  // Centro: puntuación.
  ctx.font = font(24); ctx.fillStyle = "#7a5f00"; ctx.fillText(String(data.score), 152, 142); ctx.fillStyle = "#ffcb05"; ctx.fillText(String(data.score), 150, 140);
  ctx.font = font(8); ctx.fillStyle = "#a7acbd"; ctx.fillText("PUNTOS", 150, 170);
  // Recuento: un cuadrado del color de la casilla + número (sin emojis: la fuente no los tiene).
  const items = data.stats.map((stat) => ({ ...stat, width: (stat.color ? 12 : (stat.label.length + 1) * 8) + stat.value.length * 8 }));
  const gap = 16; const total = items.reduce((sum, item) => sum + item.width, 0) + gap * Math.max(0, items.length - 1);
  let cursor = Math.round((size - total) / 2);
  ctx.textAlign = "left";
  for (const item of items) {
    if (item.color) { ctx.fillStyle = item.color; ctx.fillRect(cursor, 254, 8, 8); ctx.fillStyle = "#f7f7fa"; ctx.fillText(item.value, cursor + 12, 254); }
    else { ctx.fillStyle = "#a7acbd"; ctx.fillText(canvasText(item.label), cursor, 254); ctx.fillStyle = "#f7f7fa"; ctx.fillText(item.value, cursor + (item.label.length + 1) * 8, 254); }
    cursor += item.width + gap;
  }
  ctx.textAlign = "center"; ctx.fillStyle = "#ffcb05"; ctx.fillText(data.footer, 150, 274);
  ctx.restore();
}

export async function renderShareCard(data: ShareCardData, doc: Document = document): Promise<Blob> {
  try {
    const fontPromise = doc.fonts?.load('8px "Press Start 2P"') ?? Promise.resolve();
    await Promise.race([fontPromise, new Promise<void>((resolve) => window.setTimeout(resolve, 1500))]);
  } catch { /* La imagen también funciona con la fuente de reserva. */ }
  const canvas = doc.createElement("canvas"); canvas.width = SHARE_CARD_LOGICAL * SHARE_CARD_SCALE; canvas.height = SHARE_CARD_LOGICAL * SHARE_CARD_SCALE;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas no disponible");
  drawShareCard(context, data);
  return new Promise<Blob>((resolve, reject) => { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen")), "image/png"); });
}

interface ShareNavigator { canShare?: (data: { files: File[] }) => boolean; share?: (data: { files: File[]; title: string; text: string }) => Promise<void>; }
export async function shareImage(blob: Blob, data: ShareCardData, text: string, nav: ShareNavigator = navigator as unknown as ShareNavigator, doc: Document = document): Promise<"shared" | "cancelled" | "downloaded" | "failed"> {
  const file = new File([blob], data.fileName, { type: "image/png" });
  try {
    if (typeof nav.canShare === "function" && nav.canShare({ files: [file] }) && nav.share) { await nav.share({ files: [file], title: "Roscodex", text }); return "shared"; }
  } catch (error) { if ((error as { name?: unknown } | null)?.name === "AbortError") return "cancelled"; }
  try {
    const url = URL.createObjectURL(blob); const link = doc.createElement("a"); link.href = url; link.download = data.fileName; link.rel = "noopener"; doc.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10_000); return "downloaded";
  } catch { return "failed"; }
}
