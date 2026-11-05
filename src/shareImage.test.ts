// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { LETTERS, type RoscoStatus } from "./game";
import type { DailyCell, DailyResult } from "./daily";
import {
  canvasText,
  dailyShareCard,
  drawShareCard,
  gameShareCard,
  ringCellPosition,
  renderShareCard,
  shareImage,
  SHARE_CARD_FOOTER,
  SHARE_CARD_LOGICAL,
  SHARE_CARD_SCALE,
  type ShareCanvasContext
} from "./shareImage";
import { createGameState } from "./gameState";
import { roscoDePrueba } from "./test/fixtures";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function celdasMixtas(): DailyCell[] {
  return [
    ...Array.from({ length: 13 }, () => "correct" as const),
    ...Array.from({ length: 5 }, () => "wrong" as const),
    ...Array.from({ length: 4 }, () => "passed" as const),
    ...Array.from({ length: 4 }, () => "empty" as const)
  ];
}

function resultadoDiario(cambios: Partial<DailyResult> = {}): DailyResult {
  return {
    date: "2026-10-31", number: 1, cells: celdasMixtas(), score: 130,
    correct: 13, wrong: 5, passed: 4, finished: true, ...cambios
  };
}

function partidaNormal() {
  const base = createGameState("normal", roscoDePrueba("normal"), 0, "timed");
  const statuses: Record<string, RoscoStatus> = { ...base.statuses, A: "correct", B: "wrong", C: "passed", D: "expired" };
  return { ...base, statuses, score: 42, correct: 1, wrong: 1, passed: 1 };
}

interface LlamadasContexto {
  scale: [number, number][];
  fillRect: [number, number, number, number][];
  fillText: { texto: string; x: number; y: number }[];
  save: number;
  restore: number;
}

function contextoFalso(): { ctx: ShareCanvasContext; llamadas: LlamadasContexto } {
  const llamadas: LlamadasContexto = { scale: [], fillRect: [], fillText: [], save: 0, restore: 0 };
  const ctx: ShareCanvasContext = {
    fillStyle: "",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    imageSmoothingEnabled: true,
    fillRect: (x, y, width, height) => { llamadas.fillRect.push([x, y, width, height]); },
    fillText: (texto, x, y) => { llamadas.fillText.push({ texto, x, y }); },
    save: () => { llamadas.save += 1; },
    restore: () => { llamadas.restore += 1; },
    scale: (x, y) => { llamadas.scale.push([x, y]); }
  };
  return { ctx, llamadas };
}

function documentoConCanvas(canvas: unknown): Document {
  return {
    fonts: { load: vi.fn(async () => []) },
    createElement: vi.fn(() => canvas)
  } as unknown as Document;
}

function documentoDeDescarga() {
  const enlace = { href: "", download: "", rel: "", click: vi.fn(), remove: vi.fn() };
  const cuerpo = { appendChild: vi.fn() };
  return {
    doc: { createElement: vi.fn(() => enlace), body: cuerpo } as unknown as Document,
    enlace,
    cuerpo
  };
}

describe("tarjetas para compartir", () => {
  it("construye la tarjeta del día con 26 casillas, estadísticas y nombre de archivo", () => {
    const result = resultadoDiario();
    const card = dailyShareCard(result, 4);
    expect(card.cells).toHaveLength(26);
    expect(card.cells.map((item) => item.letter)).toEqual(LETTERS);
    expect(card.cells.map((item) => item.cell)).toEqual(result.cells);
    expect(card.kicker).toBe("ROSCO DEL DIA");
    expect(card.title).toBe("#1");
    expect(card.subtitle).toBe("31/10/2026");
    expect(card.score).toBe(130);
    expect(card.fileName).toBe("roscodex-rosco-del-dia-1.png");
    expect(card.footer).toBe(SHARE_CARD_FOOTER);
    expect(card.stats).toEqual([
      { label: "ACIERTOS", value: "13", color: "#35cf78" },
      { label: "FALLOS", value: "5", color: "#ef5262" },
      { label: "PASADAS", value: "4", color: "#5874ff" },
      { label: "RACHA", value: "4" }
    ]);
  });

  it("construye la tarjeta de partida con las letras y sus estados", () => {
    const card = gameShareCard(partidaNormal());
    expect(card.cells.map((item) => item.letter)).toEqual(LETTERS);
    expect(card.cells.slice(0, 4).map((item) => item.cell)).toEqual(["correct", "wrong", "passed", "empty"]);
    expect(card.cells.slice(4).every((item) => item.cell === "empty")).toBe(true);
    expect(card.kicker).toBe("NORMAL");
    expect(card.title).toBe("CON RELOJ");
    expect(card.subtitle).toBe("¿ME SUPERAS?");
    expect(card.score).toBe(42);
    expect(card.fileName).toBe("roscodex-resultado.png");
    expect(card.stats.map((item) => item.value)).toEqual(["1", "1", "1"]);
  });

  it("no filtra enunciados ni opciones de las preguntas", () => {
    const textos = [
      JSON.stringify(dailyShareCard(resultadoDiario(), 4)),
      JSON.stringify(gameShareCard(partidaNormal()))
    ];
    for (const texto of textos) {
      for (const prohibido of ["Pregunta de la A", "Opción A de la A", "Explicación de la A"]) {
        expect(texto).not.toContain(prohibido);
      }
    }
  });
});

describe("ringCellPosition", () => {
  it("coloca la A arriba y centrada, con enteros, simetría y dentro del lienzo", () => {
    const posiciones = LETTERS.map((_, index) => ringCellPosition(index));
    for (const { x, y } of posiciones) {
      expect(Number.isInteger(x)).toBe(true);
      expect(Number.isInteger(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + 16).toBeLessThanOrEqual(SHARE_CARD_LOGICAL);
      expect(y + 16).toBeLessThanOrEqual(SHARE_CARD_LOGICAL);
    }

    const a = posiciones[0];
    expect(a.y).toBe(Math.min(...posiciones.map((posicion) => posicion.y)));
    expect(Math.abs(a.x + 8 - 150)).toBeLessThanOrEqual(1);

    for (let index = 0; index < posiciones.length; index += 1) {
      const opuesta = posiciones[(index + 13) % posiciones.length];
      expect(Math.abs(posiciones[index].x + opuesta.x + 16 - 300)).toBeLessThanOrEqual(2);
      expect(Math.abs(posiciones[index].y + opuesta.y + 16 - 316)).toBeLessThanOrEqual(2);
    }
  });
});

describe("drawShareCard", () => {
  it("escala el lienzo, pinta la tarjeta y no usa emojis", () => {
    const { ctx, llamadas } = contextoFalso();
    const datos = dailyShareCard(resultadoDiario(), 4);
    drawShareCard(ctx, datos);

    expect(llamadas.scale).toEqual([[SHARE_CARD_SCALE, SHARE_CARD_SCALE]]);
    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(llamadas.save).toBe(1);
    expect(llamadas.restore).toBe(1);

    const textos = llamadas.fillText.map((item) => item.texto);
    expect(textos).toContain("ROSCODEX");
    expect(textos.filter((texto) => texto === "130").length).toBeGreaterThanOrEqual(2);
    expect(textos).toContain("PUNTOS");
    expect(textos).toContain(SHARE_CARD_FOOTER);
    expect(textos).toContain("RACHA");
    expect(textos.filter((texto) => /^[A-Z]$/.test(texto))).toEqual(LETTERS);
    expect(textos.some((texto) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(texto))).toBe(false);

    expect(llamadas.fillRect.every(([x, y, width, height]) => x >= 0 && y >= 0 && x + width <= SHARE_CARD_LOGICAL && y + height <= SHARE_CARD_LOGICAL)).toBe(true);
  });

  it("no pinta mayúsculas acentuadas: Press Start 2P las dibuja como minúsculas (revisión de Fable)", () => {
    expect(canvasText("ROSCO DEL DÍA · DIFÍCIL · PRÁCTICA · ÉXITO · ÓPALO · ÚLTIMO · PINGÜINO · ESPAÑA")).toBe("ROSCO DEL DIA · DIFICIL · PRACTICA · EXITO · OPALO · ULTIMO · PINGUINO · ESPAÑA");
    expect(dailyShareCard(resultadoDiario(), 1).kicker).toBe("ROSCO DEL DIA");
    const base = createGameState("hard", roscoDePrueba("hard"), 0, "practice");
    const tarjeta = gameShareCard(base);
    expect(tarjeta.kicker).toBe("DIFICIL");
    expect(tarjeta.title).toBe("PRACTICA");
    for (const datos of [dailyShareCard(resultadoDiario(), 1), tarjeta, { ...tarjeta, subtitle: "ÚLTIMO DÍA", kicker: "DIFÍCIL" }]) {
      const { ctx, llamadas } = contextoFalso();
      drawShareCard(ctx, datos);
      expect(llamadas.fillText.map((item) => item.texto).filter((texto) => /[ÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛ]/.test(texto))).toEqual([]);
    }
  });
});

describe("renderShareCard", () => {
  it("rechaza si el lienzo no da contexto 2D", async () => {
    vi.useFakeTimers();
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => null), toBlob: vi.fn() };
    await expect(renderShareCard(dailyShareCard(resultadoDiario(), 1), documentoConCanvas(canvas))).rejects.toThrow("Canvas no disponible");
  });

  it("resuelve con el Blob que entrega toBlob", async () => {
    vi.useFakeTimers();
    const { ctx } = contextoFalso();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: (callback: (blob: Blob | null) => void) => { callback(new Blob(["png"], { type: "image/png" })); }
    };
    const blob = await renderShareCard(dailyShareCard(resultadoDiario(), 1), documentoConCanvas(canvas));
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
  });

  it("rechaza si toBlob no entrega ningún Blob", async () => {
    vi.useFakeTimers();
    const { ctx } = contextoFalso();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: (callback: (blob: Blob | null) => void) => { callback(null); }
    };
    await expect(renderShareCard(dailyShareCard(resultadoDiario(), 1), documentoConCanvas(canvas))).rejects.toThrow("No se pudo crear la imagen");
  });
});

describe("shareImage", () => {
  const datos = dailyShareCard(resultadoDiario(), 1);
  const blob = new Blob(["png"], { type: "image/png" });

  it("comparte el archivo cuando canShare lo permite", async () => {
    const recibido: { valor: { files: File[]; title: string; text: string } | null } = { valor: null };
    const nav = {
      canShare: () => true,
      share: async (payload: { files: File[]; title: string; text: string }) => { recibido.valor = payload; }
    };
    expect(await shareImage(blob, datos, "texto de prueba", nav)).toBe("shared");
    const payload = recibido.valor;
    if (!payload) throw new Error("No se compartió nada");
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0]).toBeInstanceOf(File);
    expect(payload.files[0].name).toBe(datos.fileName);
    expect(payload.files[0].type).toBe("image/png");
    expect(payload.title).toBe("Roscodex");
    expect(payload.text).toBe("texto de prueba");
  });

  it("devuelve cancelled si se aborta el diálogo del sistema", async () => {
    const nav = { canShare: () => true, share: async () => { throw { name: "AbortError" }; } };
    expect(await shareImage(blob, datos, "texto", nav)).toBe("cancelled");
  });

  it("descarga si share falla por permiso y deja el enlace preparado", async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:prueba");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const { doc, enlace, cuerpo } = documentoDeDescarga();
    const nav = { canShare: () => true, share: async () => { throw { name: "NotAllowedError" }; } };

    expect(await shareImage(blob, datos, "texto", nav, doc)).toBe("downloaded");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(enlace.href).toBe("blob:prueba");
    expect(enlace.download).toBe(datos.fileName);
    expect(enlace.rel).toBe("noopener");
    expect(cuerpo.appendChild).toHaveBeenCalledWith(enlace);
    expect(enlace.click).toHaveBeenCalledOnce();
    expect(enlace.remove).toHaveBeenCalledOnce();
  });

  it("descarga si canShare no existe", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:prueba"), revokeObjectURL: vi.fn() });
    const { doc, enlace } = documentoDeDescarga();
    const nav = { share: vi.fn(async () => undefined) };
    expect(await shareImage(blob, datos, "texto", nav, doc)).toBe("downloaded");
    expect(enlace.download).toBe(datos.fileName);
  });

  it("descarga si canShare devuelve false sin llamar a share", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:prueba"), revokeObjectURL: vi.fn() });
    const { doc, enlace } = documentoDeDescarga();
    const share = vi.fn(async () => undefined);
    const nav = { canShare: () => false, share };
    expect(await shareImage(blob, datos, "texto", nav, doc)).toBe("downloaded");
    expect(share).not.toHaveBeenCalled();
    expect(enlace.download).toBe(datos.fileName);
  });

  it("devuelve failed si no puede crear la URL de descarga", async () => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => { throw new Error("Bloqueado"); }),
      revokeObjectURL: vi.fn()
    });
    const { doc } = documentoDeDescarga();
    const nav = { share: vi.fn(async () => undefined) };
    expect(await shareImage(blob, datos, "texto", nav, doc)).toBe("failed");
  });
});
