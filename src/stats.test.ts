import { beforeEach, describe, expect, it, vi } from "vitest";
import { accuracyPercent, applyGame, emptyStats, loadStats, parseStats, recordGame, resetStats } from "./stats";
import { advance, answerCurrent, createGameState, passCurrent } from "./gameState";
import { LETTERS } from "./game";
import { STORAGE_KEYS } from "./storage";
import { crearAlmacenFalso, roscoDePrueba } from "./test/fixtures";

let almacen: ReturnType<typeof crearAlmacenFalso>;
beforeEach(() => {
  almacen = crearAlmacenFalso();
  vi.stubGlobal("localStorage", almacen);
});

function partidaConResultados() {
  let partida = createGameState("beginner", roscoDePrueba(), 1_000, "practice");
  partida = advance(answerCurrent(partida, "a").state);
  partida = advance(answerCurrent(partida, "b").state);
  return advance(passCurrent(partida));
}

describe("parseStats", () => {
  it("devuelve estadísticas vacías si no hay datos, el JSON está roto o es un array", () => {
    expect(parseStats(null)).toEqual(emptyStats());
    expect(parseStats("")).toEqual(emptyStats());
    expect(parseStats("{esto no es json")).toEqual(emptyStats());
    expect(parseStats("[1,2,3]")).toEqual(emptyStats());
  });

  it("descarta cada número inválido sin perder los campos válidos", () => {
    expect(parseStats('{"games":-1,"correct":2.5,"wrong":"3","passed":4,"bestStreak":10000001}')).toEqual({
      ...emptyStats(),
      passed: 4
    });
    expect(parseStats(JSON.stringify({ games: NaN, correct: 3, wrong: Infinity, bestStreak: -4 }))).toEqual({
      ...emptyStats(),
      correct: 3
    });
  });

  it("ignora letras que no son A–Z, datos incoherentes y tipos raros", () => {
    const crudo = '{"games":2,"byLetter":{"A":{"played":2,"correct":1},"B":{"played":1,"correct":2},"C":{"played":0.5,"correct":0},"D":{"played":1,"correct":0},"Ñ":{"played":1,"correct":1},"a":{"played":1,"correct":0},"__proto__":{"played":9,"correct":9}}}';
    expect(parseStats(crudo).byLetter).toEqual({
      A: { played: 2, correct: 1 },
      D: { played: 1, correct: 0 }
    });
  });

  it("nunca lanza con valores extraños", () => {
    expect(() => parseStats("\u0000")).not.toThrow();
    expect(() => parseStats(JSON.stringify({ byLetter: "no-es-objeto" }))).not.toThrow();
  });
});

describe("applyGame", () => {
  it("suma la partida y cuenta una jugada por cada letra del rosco", () => {
    const partida = partidaConResultados();
    const resultado = applyGame(emptyStats(), partida);
    expect(resultado).toMatchObject({ games: 1, correct: 1, wrong: 1, passed: 1, bestStreak: 1 });
    expect(Object.keys(resultado.byLetter)).toHaveLength(LETTERS.length);
    expect(resultado.byLetter.A).toEqual({ played: 1, correct: 1 });
    expect(resultado.byLetter.B).toEqual({ played: 1, correct: 0 });
    expect(resultado.byLetter.C).toEqual({ played: 1, correct: 0 });
    expect(resultado.byLetter.Z).toEqual({ played: 1, correct: 0 });
  });

  it("conserva la mejor racha histórica si la partida no la supera", () => {
    const resultado = applyGame({ ...emptyStats(), bestStreak: 5 }, partidaConResultados());
    expect(resultado.bestStreak).toBe(5);
  });

  it("no muta el objeto de entrada", () => {
    const entrada = { ...emptyStats(), byLetter: { A: { played: 1, correct: 1 } } };
    const copia = structuredClone(entrada);
    const resultado = applyGame(entrada, partidaConResultados());
    expect(entrada).toEqual(copia);
    expect(resultado).not.toBe(entrada);
  });
});

describe("recordGame y resetStats", () => {
  it("guarda la partida en la clave de estadísticas", () => {
    expect(STORAGE_KEYS.stats).toBe("roscodex-stats-v1");
    recordGame(partidaConResultados());
    expect(almacen.getItem(STORAGE_KEYS.stats)).not.toBeNull();
    expect(loadStats()).toMatchObject({ games: 1, correct: 1, wrong: 1, passed: 1 });
  });

  it("la partida guiada no cuenta ni escribe estadísticas", () => {
    recordGame(createGameState("beginner", roscoDePrueba(), 1_000, "guided"));
    expect(almacen.getItem(STORAGE_KEYS.stats)).toBeNull();
    expect(loadStats()).toEqual(emptyStats());
  });

  it("borra las estadísticas y los dos récords", () => {
    almacen.setItem(STORAGE_KEYS.stats, JSON.stringify(emptyStats()));
    almacen.setItem(STORAGE_KEYS.records, "{}");
    almacen.setItem(STORAGE_KEYS.blitzRecords, "{}");
    resetStats();
    expect(almacen.getItem(STORAGE_KEYS.stats)).toBeNull();
    expect(almacen.getItem(STORAGE_KEYS.records)).toBeNull();
    expect(almacen.getItem(STORAGE_KEYS.blitzRecords)).toBeNull();
  });

  it("todas las claves usadas empiezan por roscodex-", () => {
    for (const clave of Object.values(STORAGE_KEYS)) expect(clave.startsWith("roscodex-")).toBe(true);
  });
});

describe("accuracyPercent", () => {
  it("redondea el porcentaje y devuelve null si no hay intentos", () => {
    expect(accuracyPercent(1, 3)).toBe(33);
    expect(accuracyPercent(2, 3)).toBe(67);
    expect(accuracyPercent(0, 0)).toBeNull();
    expect(accuracyPercent(5, 0)).toBeNull();
  });
});
