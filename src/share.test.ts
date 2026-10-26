import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareText, SHARE_URL, shareResult } from "./share";
import { createGameState, type GameMode } from "./gameState";
import type { Difficulty, RoscoStatus } from "./game";
import { roscoDePrueba } from "./test/fixtures";

afterEach(() => vi.unstubAllGlobals());

function partida(mode: GameMode = "practice", difficulty: Difficulty = "normal") {
  const base = createGameState(difficulty, roscoDePrueba(difficulty), 0, mode);
  return {
    ...base,
    score: 20,
    correct: 2,
    wrong: 1,
    passed: 1,
    statuses: { ...base.statuses, A: "correct", B: "wrong" } as Record<string, RoscoStatus>
  };
}

type NavegadorFalso = Pick<Navigator, "share" | "clipboard">;

describe("buildShareText", () => {
  const casos: [Difficulty, GameMode, string, string][] = [
    ["beginner", "timed", "PRINCIPIANTE", "Con reloj"],
    ["normal", "blitz", "NORMAL", "Contrarreloj"],
    ["hard", "practice", "DIFÍCIL", "Práctica"]
  ];

  it.each(casos)("resume la partida de %s en modo %s en cuatro líneas", (difficulty, mode, etiqueta, textoModo) => {
    const lineas = buildShareText(partida(mode, difficulty)).split("\n");
    expect(lineas).toHaveLength(4);
    expect(lineas[0]).toBe(`Roscodex · ${etiqueta} · ${textoModo}`);
    expect(lineas[1]).toBe("🏆 20 puntos · ✅ 2 · ❌ 1 · ↻ 1");
    expect(lineas[3]).toBe(`¿Me superas? ${SHARE_URL}`);
    expect(lineas[3].endsWith(SHARE_URL)).toBe(true);
  });

  it("pinta 26 casillas según el estado de cada letra", () => {
    const celdas = buildShareText(partida()).split("\n")[2];
    const simbolos = Array.from(celdas);
    expect(simbolos).toHaveLength(26);
    expect(simbolos[0]).toBe("🟩");
    expect(simbolos[1]).toBe("🟥");
    expect(simbolos.slice(2)).toEqual(Array(24).fill("⬜"));
  });

  it("no incluye el texto de las preguntas ni de las opciones", () => {
    const texto = buildShareText(partida());
    expect(texto).not.toContain("Pregunta de la A");
    expect(texto).not.toContain("Opción A de la A");
  });
});

describe("shareResult", () => {
  it("usa share y devuelve shared sin tocar el portapapeles", async () => {
    const share = vi.fn(async () => undefined);
    const writeText = vi.fn(async () => undefined);
    const navegador = { share, clipboard: { writeText } } as unknown as NavegadorFalso;
    expect(await shareResult("Roscodex · prueba", navegador)).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Roscodex", text: "Roscodex · prueba" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("devuelve cancelled si el usuario cancela y no prueba el portapapeles", async () => {
    const share = vi.fn(async () => { throw { name: "AbortError" }; });
    const writeText = vi.fn(async () => undefined);
    const navegador = { share, clipboard: { writeText } } as unknown as NavegadorFalso;
    expect(await shareResult("texto", navegador)).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("si share falla por otro motivo copia al portapapeles", async () => {
    const share = vi.fn(async () => { throw new Error("No disponible"); });
    const writeText = vi.fn(async () => undefined);
    const navegador = { share, clipboard: { writeText } } as unknown as NavegadorFalso;
    expect(await shareResult("texto", navegador)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("texto");
  });

  it("sin share usa el portapapeles", async () => {
    const writeText = vi.fn(async () => undefined);
    const navegador = { clipboard: { writeText } } as unknown as NavegadorFalso;
    expect(await shareResult("texto", navegador)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("texto");
  });

  it("devuelve unavailable si el portapapeles lanza", async () => {
    const writeText = vi.fn(async () => { throw new Error("Bloqueado"); });
    const navegador = { clipboard: { writeText } } as unknown as NavegadorFalso;
    expect(await shareResult("texto", navegador)).toBe("unavailable");
  });

  it("devuelve unavailable sin share ni portapapeles", async () => {
    expect(await shareResult("texto", {} as NavegadorFalso)).toBe("unavailable");
    vi.stubGlobal("navigator", {});
    expect(await shareResult("texto")).toBe("unavailable");
  });
});
