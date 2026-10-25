import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadRecords, registerResult } from "./records";
import { STORAGE_KEYS } from "./storage";
import { crearAlmacenFalso } from "./test/fixtures";

let almacen: ReturnType<typeof crearAlmacenFalso>;
beforeEach(() => {
  almacen = crearAlmacenFalso();
  vi.stubGlobal("localStorage", almacen);
});

describe("records", () => {
  it("la primera partida con puntos es récord", () => {
    const resultado = registerResult("normal", 120, 12);
    expect(resultado).toEqual({ record: { bestScore: 120, bestCorrect: 12, games: 1 }, isNewRecord: true, previousBest: null });
    expect(loadRecords().normal).toEqual({ bestScore: 120, bestCorrect: 12, games: 1 });
  });

  it("una primera partida a cero no es récord", () => {
    expect(registerResult("hard", 0, 0).isNewRecord).toBe(false);
  });

  it("solo hay récord nuevo si se supera el anterior, y cuenta partidas", () => {
    registerResult("normal", 120, 12);
    expect(registerResult("normal", 120, 12).isNewRecord).toBe(false);
    const mejor = registerResult("normal", 150, 15);
    expect(mejor).toMatchObject({ isNewRecord: true, previousBest: 120, record: { bestScore: 150, games: 3 } });
    const peor = registerResult("normal", 50, 5);
    expect(peor).toMatchObject({ isNewRecord: false, record: { bestScore: 150, bestCorrect: 15, games: 4 } });
  });

  it("cada dificultad lleva su propio récord", () => {
    registerResult("normal", 120, 12);
    registerResult("extreme", 40, 4);
    expect(loadRecords()).toMatchObject({ normal: { bestScore: 120 }, extreme: { bestScore: 40 } });
    expect(loadRecords().beginner).toBeUndefined();
  });

  it.each([
    ["JSON roto", "{no es json"],
    ["un array", "[1,2]"],
    ["campos que no son números", JSON.stringify({ normal: { bestScore: "mucho", bestCorrect: 1, games: 1 } })],
    ["dificultad desconocida", JSON.stringify({ legendaria: { bestScore: 1, bestCorrect: 1, games: 1 } })]
  ])("ignora datos corruptos (%s) sin lanzar", (_caso, valor) => {
    almacen.setItem(STORAGE_KEYS.records, valor);
    expect(loadRecords()).toEqual({});
    expect(registerResult("normal", 10, 1).isNewRecord).toBe(true);
  });

  it("conserva los récords válidos aunque otros estén corruptos", () => {
    almacen.setItem(STORAGE_KEYS.records, JSON.stringify({ normal: { bestScore: 90, bestCorrect: 9, games: 2 }, hard: null }));
    expect(loadRecords()).toEqual({ normal: { bestScore: 90, bestCorrect: 9, games: 2 } });
  });

  it("funciona aunque el almacenamiento esté bloqueado", () => {
    const roto = () => { throw new Error("SecurityError"); };
    vi.stubGlobal("localStorage", { getItem: roto, setItem: roto, removeItem: roto });
    expect(loadRecords()).toEqual({});
    expect(registerResult("normal", 30, 3).isNewRecord).toBe(true);
  });
});
