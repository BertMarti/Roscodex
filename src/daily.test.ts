import { afterEach, describe, expect, it, vi } from "vitest";
import { LETTERS, type QuestionPack, type RoscoStatus } from "./game";
import { buildDailyShareText, cellsFromGame, chooseDailyQuestions, createRandom, currentStreak, dailyNumber, dayIndex, describeCountdown, emptyDaily, formatCountdown, isDateKey, loadDaily, localDateKey, msUntilNextDay, parseDaily, saveDaily, seedFromKey, startDaily, updateDailyProgress, type DailyCell, type DailyData, type DailyResult } from "./daily";
import { createGameState } from "./gameState";
import { STORAGE_KEYS } from "./storage";
import { SHARE_URL } from "./share";
import { crearAlmacenFalso, preguntaDePrueba, roscoDePrueba } from "./test/fixtures";

afterEach(() => vi.unstubAllGlobals());

function banco(): QuestionPack[] {
  return [{ id: "normal", difficulty: "normal", questions: LETTERS.flatMap((letter) => [1, 2, 3].map((number) => ({ ...preguntaDePrueba(letter, "normal"), id: `${letter}-${number}` })) ) }];
}

function celdasMixtas(): DailyCell[] {
  return [
    ...Array.from({ length: 13 }, () => "correct" as const),
    ...Array.from({ length: 5 }, () => "wrong" as const),
    ...Array.from({ length: 4 }, () => "passed" as const),
    ...Array.from({ length: 4 }, () => "empty" as const)
  ];
}

describe("Rosco del día", () => {
  it("forma fechas locales y valida fechas reales", () => {
    expect(localDateKey(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31");
    expect(localDateKey(new Date(2026, 10, 1))).toBe("2026-11-01");
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(dayIndex("2026-03-30") - dayIndex("2026-03-29")).toBe(1);
    expect(dailyNumber("2026-10-31")).toBe(1);
  });

  it("selecciona y baraja de forma determinista sin aleatoriedad global", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("no usar Math.random"); });
    const first = chooseDailyQuestions(banco(), "2026-10-31");
    const second = chooseDailyQuestions(banco().reverse(), "2026-10-31");
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
    expect(first.map((question) => question.options.map((option) => option.id))).toEqual(second.map((question) => question.options.map((option) => option.id)));
    random.mockRestore();
  });

  it("calcula cuenta atrás y valida basura persistida", () => {
    expect(formatCountdown(3_601_001)).toBe("01:00:02");
    expect(parseDaily("{")).toEqual(emptyDaily());
    expect(parseDaily(JSON.stringify({ streak: -1, result: { date: "2026-02-30" } }))).toEqual(emptyDaily());
    expect(parseDaily(JSON.stringify({ __proto__: { polluted: true } }))).toEqual(emptyDaily());
  });

  it("mantiene la racha en días consecutivos", () => {
    let data: DailyData = emptyDaily();
    data = startDaily(data, "2026-12-31");
    data = startDaily(data, "2027-01-01");
    expect(data.streak).toBe(2);
    expect(currentStreak(data, "2027-01-03")).toBe(0);
  });

  it("genera el texto de compartir sin preguntas", () => {
    const data = startDaily(emptyDaily(), "2026-10-31");
    const text = buildDailyShareText(data.result!, 1);
    expect(text.split("\n")).toHaveLength(6);
    expect(text.endsWith(SHARE_URL)).toBe(true);
    expect(text).toContain("1 día");
    expect(text).not.toContain("Pregunta");
  });
});

describe("Rosco del día · fechas y cuenta atrás", () => {
  it("acepta fechas reales y rechaza formatos y días imposibles", () => {
    expect(isDateKey("2026-10-31")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
    for (const value of ["2027-02-29", "2026-13-01", "2026-1-01", "", " 2026-10-31"]) {
      expect(isDateKey(value)).toBe(false);
    }
    expect(isDateKey(null)).toBe(false);
    expect(isDateKey(20261031)).toBe(false);
  });

  it("cuenta días entre cambios de hora y de año sin desviarse", () => {
    expect(dayIndex("2026-10-26") - dayIndex("2026-10-25")).toBe(1);
    expect(dayIndex("2026-03-30") - dayIndex("2026-03-29")).toBe(1);
    expect(dayIndex("2027-01-01") - dayIndex("2026-12-31")).toBe(1);
    expect(dailyNumber("2026-11-01")).toBe(2);
    expect(dailyNumber("2027-10-31")).toBe(366);
  });

  it("calcula la espera hasta las 00:00 y formatea la cuenta atrás", () => {
    expect(msUntilNextDay(new Date(2026, 9, 31, 23, 59, 30))).toBe(30_000);
    expect(msUntilNextDay(new Date(2026, 9, 31, 0, 0, 0))).toBe(86_400_000);
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5)).toBe("00:00:00");
    expect(formatCountdown(999)).toBe("00:00:01");
    expect(formatCountdown(86_400_000)).toBe("24:00:00");
    expect(describeCountdown((5 * 60 + 12) * 60_000)).toBe("5 h y 12 min");
    expect(describeCountdown(2 * 60 * 60_000)).toBe("2 h");
    expect(describeCountdown(12 * 60_000)).toBe("12 min");
    expect(describeCountdown(0)).toBe("menos de 1 min");
  });
});

describe("Rosco del día · selección determinista", () => {
  it("repite la misma selección y el mismo barajado sin usar el azar global", () => {
    const first = chooseDailyQuestions(banco(), "2026-10-31");
    const second = chooseDailyQuestions(banco(), "2026-10-31");
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id));
    expect(first.map((question) => question.options.map((option) => option.id))).toEqual(second.map((question) => question.options.map((option) => option.id)));
  });

  it("devuelve 26 letras en orden, conserva opciones y no muta el banco", () => {
    const pack = banco();
    const original = pack[0].questions.map((question) => question.options.map((option) => option.id));
    const selected = chooseDailyQuestions(pack, "2026-10-31");
    expect(selected).toHaveLength(26);
    expect(selected.map((question) => question.letter)).toEqual(LETTERS);
    for (const question of selected) {
      const source = pack[0].questions.find((item) => item.id === question.id);
      expect(source).toBeTruthy();
      expect(question.options.map((option) => option.id).sort()).toEqual(source!.options.map((option) => option.id).sort());
      expect(question.correctOptionId).toBe(source!.correctOptionId);
    }
    expect(pack[0].questions.map((question) => question.options.map((option) => option.id))).toEqual(original);
  });

  it("no cambia con el orden del pack ni con historial en localStorage", () => {
    const reference = chooseDailyQuestions(banco(), "2026-10-31");
    const pack = banco();
    const rotated: QuestionPack[] = [{ ...pack[0], questions: [...pack[0].questions.slice(9), ...pack[0].questions.slice(0, 9)] }];
    const reordered = chooseDailyQuestions(rotated, "2026-10-31");
    expect(reordered.map((question) => question.id)).toEqual(reference.map((question) => question.id));
    expect(reordered.map((question) => question.options.map((option) => option.id))).toEqual(reference.map((question) => question.options.map((option) => option.id)));

    const store = crearAlmacenFalso();
    vi.stubGlobal("localStorage", store);
    const history = JSON.stringify({ normal: banco()[0].questions.map((question) => question.id) });
    store.setItem(STORAGE_KEYS.questionHistory, history);
    const conHistorial = chooseDailyQuestions(banco(), "2026-10-31");
    expect(conHistorial.map((question) => question.id)).toEqual(reference.map((question) => question.id));
    expect(store.getItem(STORAGE_KEYS.questionHistory)).toBe(history);
    expect(store.mapa.size).toBe(1);
  });

  it("cambia de selección entre fechas seguidas", () => {
    const fechas = Array.from({ length: 10 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 9, 31 + index));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    });
    const selecciones = new Set(fechas.map((fecha) => chooseDailyQuestions(banco(), fecha).map((question) => question.id).join("|")));
    expect(selecciones.size).toBeGreaterThanOrEqual(3);
  });

  it("lanza sin banco normal, sin candidatos o con fecha no válida", () => {
    const soloPrincipiante: QuestionPack[] = [{ id: "pack-beginner", difficulty: "beginner", questions: roscoDePrueba("beginner") }];
    expect(() => chooseDailyQuestions(soloPrincipiante, "2026-10-31")).toThrow();
    const sinZ = banco();
    sinZ[0].questions = sinZ[0].questions.filter((question) => question.letter !== "Z");
    expect(() => chooseDailyQuestions(sinZ, "2026-10-31")).toThrow();
    expect(() => chooseDailyQuestions(banco(), "2026-02-30")).toThrow();
  });
});

describe("Rosco del día · semilla y azar reproducible", () => {
  it("deriva una semilla estable de 32 bits y secuencias repetibles", () => {
    expect(seedFromKey("2026-10-31")).toBe(seedFromKey("2026-10-31"));
    expect(seedFromKey("2026-10-31")).not.toBe(seedFromKey("2026-11-01"));
    const seed = seedFromKey("2026-10-31");
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);

    const first = createRandom(seed);
    const second = createRandom(seed);
    const values = Array.from({ length: 20 }, () => first());
    expect(values).toEqual(Array.from({ length: 20 }, () => second()));
    for (const value of [...values, ...Array.from({ length: 20 }, () => first())]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("Rosco del día · racha", () => {
  it("suma la racha por días consecutivos y la reinicia tras un hueco", () => {
    let data = startDaily(emptyDaily(), "2026-10-31");
    expect(data.streak).toBe(1);
    expect(data.bestStreak).toBe(1);
    expect(data.result).toMatchObject({
      date: "2026-10-31",
      number: dailyNumber("2026-10-31"),
      score: 0,
      correct: 0,
      wrong: 0,
      passed: 0,
      finished: false
    });
    expect(data.result?.cells).toEqual(LETTERS.map(() => "empty"));

    data = startDaily(data, "2026-11-01");
    expect(data.streak).toBe(2);
    expect(data.bestStreak).toBe(2);

    data = startDaily(data, "2026-11-01");
    expect(data.streak).toBe(2);
    expect(data.result?.date).toBe("2026-11-01");

    data = startDaily(data, "2026-11-03");
    expect(data.streak).toBe(1);
    expect(data.bestStreak).toBe(2);

    expect(startDaily(startDaily(emptyDaily(), "2026-11-30"), "2026-12-01").streak).toBe(2);
    expect(startDaily(startDaily(emptyDaily(), "2026-12-31"), "2027-01-01").streak).toBe(2);
  });

  it("calcula la racha viva con hoy, ayer y relojes atrasados", () => {
    const data = startDaily(startDaily(emptyDaily(), "2026-10-30"), "2026-10-31");
    expect(currentStreak(data, "2026-10-31")).toBe(2);
    expect(currentStreak(data, "2026-11-01")).toBe(2);
    expect(currentStreak(data, "2026-11-02")).toBe(0);
    expect(currentStreak(startDaily(emptyDaily(), "2026-10-30"), "2026-10-31")).toBe(1);
    expect(currentStreak(startDaily(emptyDaily(), "2026-10-29"), "2026-10-31")).toBe(0);
    expect(currentStreak(emptyDaily(), "2026-10-31")).toBe(0);

    const futuro = startDaily(emptyDaily(), "2026-11-02");
    expect(currentStreak(futuro, "2026-10-31")).toBe(0);
    expect(startDaily(futuro, "2026-10-31").streak).toBe(1);
  });
});

describe("Rosco del día · datos guardados", () => {
  it("descarta JSON roto, valores raros y resultados incompletos", () => {
    for (const raw of [null, "", "{", "[]", "42", "null"]) expect(parseDaily(raw)).toEqual(emptyDaily());
    for (const streak of [-1, 1.5, "3", 2_000_000]) expect(parseDaily(JSON.stringify({ streak })).streak).toBe(0);
    expect(parseDaily(JSON.stringify({ lastDate: "2026-02-30" })).lastDate).toBeNull();

    const valido = { date: "2026-10-31", number: 1, cells: LETTERS.map(() => "empty"), score: 0, correct: 0, wrong: 0, passed: 0, finished: false };
    const invalidos: Record<string, unknown>[] = [
      { ...valido, cells: LETTERS.slice(0, 25).map(() => "empty") },
      { ...valido, cells: ["otro", ...LETTERS.slice(1).map(() => "empty")] },
      { ...valido, finished: "sí" },
      { ...valido, date: "2026-02-30" },
      { ...valido, score: -1 }
    ];
    for (const result of invalidos) {
      const data = parseDaily(JSON.stringify({ lastDate: "2026-10-31", streak: 2, bestStreak: 3, result }));
      expect(data.result).toBeNull();
      expect(data.lastDate).toBe("2026-10-31");
      expect(data.streak).toBe(2);
      expect(data.bestStreak).toBe(3);
    }
  });

  it("no se deja contaminar por __proto__ y conserva un dato válido", () => {
    const envenenado = parseDaily('{"__proto__":{"polluted":true},"streak":2}');
    expect(envenenado.streak).toBe(2);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();

    const result: DailyResult = { date: "2026-10-31", number: 1, cells: celdasMixtas(), score: 130, correct: 13, wrong: 5, passed: 4, finished: true };
    const original: DailyData = { lastDate: "2026-10-31", streak: 3, bestStreak: 5, result };
    expect(parseDaily(JSON.stringify(original))).toEqual(original);
  });
});

describe("Rosco del día · coherencia de lo guardado (revisión cruzada)", () => {
  const base = (cambios: Partial<DailyResult> = {}): DailyResult => ({
    date: "2026-10-31", number: 1, cells: ["correct", "wrong", "passed", ...Array.from({ length: 23 }, () => "empty" as DailyCell)],
    score: 10, correct: 1, wrong: 1, passed: 1, finished: true, ...cambios
  });
  const leer = (result: DailyResult) => parseDaily(JSON.stringify({ lastDate: "2026-10-31", streak: 3, bestStreak: 5, result })).result;

  it("acepta un resultado cuyos contadores cuadran con las casillas", () => {
    expect(leer(base())).toEqual(base());
    // Pasar y luego responder en la 2.ª vuelta: ↻ cuenta más pasadas que casillas azules.
    expect(leer(base({ passed: 4 }))).toEqual(base({ passed: 4 }));
  });

  it("descarta resultados incoherentes sin perder la racha", () => {
    expect(leer(base({ correct: 0 }))).toBeNull();
    expect(leer(base({ wrong: 5 }))).toBeNull();
    expect(leer(base({ passed: 0 }))).toBeNull();
    expect(leer(base({ number: 7 }))).toBeNull();
    expect(leer(base({ date: "2026-11-01", number: 1 }))).toBeNull();
    const datos = parseDaily(JSON.stringify({ lastDate: "2026-10-31", streak: 3, bestStreak: 5, result: base({ correct: 26 }) }));
    expect(datos).toEqual({ lastDate: "2026-10-31", streak: 3, bestStreak: 5, result: null });
  });
});

describe("Rosco del día · progreso de la partida", () => {
  it("convierte los estados del rosco en casillas", () => {
    const base = createGameState("normal", roscoDePrueba("normal"), 0, "daily");
    const statuses: Record<string, RoscoStatus> = { ...base.statuses, A: "correct", B: "wrong", C: "passed", D: "expired", E: "active" };
    const cells = cellsFromGame({ ...base, statuses });
    expect(cells).toHaveLength(26);
    expect(cells.slice(0, 5)).toEqual(["correct", "wrong", "passed", "empty", "empty"]);
    expect(cells.slice(5)).toEqual(Array.from({ length: 21 }, () => "empty"));
    const segundaVuelta: Record<string, RoscoStatus> = { ...base.statuses, A: "correct" };
    expect(cellsFromGame({ ...base, statuses: segundaVuelta })[0]).toBe("correct");
  });

  it("copia el progreso solo en partidas diarias con resultado abierto", () => {
    const base = createGameState("normal", roscoDePrueba("normal"), 0, "daily");
    const statuses: Record<string, RoscoStatus> = { ...base.statuses, A: "correct", B: "wrong", C: "passed", D: "expired" };
    const game = { ...base, statuses, score: 130, correct: 13, wrong: 5, passed: 4 };
    const data = startDaily(emptyDaily(), "2026-10-31");
    const next = updateDailyProgress(data, game, true);
    expect(next.result).toMatchObject({ score: 130, correct: 13, wrong: 5, passed: 4, finished: true });
    expect(next.result?.cells).toEqual(cellsFromGame(game));
    expect(data.result?.score).toBe(0);

    const sinResultado: DailyData = { ...data, result: null };
    expect(updateDailyProgress(sinResultado, game, true)).toEqual(sinResultado);
    expect(updateDailyProgress(data, { ...game, mode: "timed" as const }, true)).toEqual(data);
  });
});

describe("Rosco del día · texto para compartir completo", () => {
  it("resume aciertos, fallos, pasadas, puntos y racha con las casillas en color", () => {
    const result: DailyResult = { date: "2026-10-31", number: 1, cells: celdasMixtas(), score: 130, correct: 13, wrong: 5, passed: 4, finished: true };
    const lines = buildDailyShareText(result, 4).split("\n");
    expect(lines).toHaveLength(6);
    expect(lines[0]).toBe("Roscodex · Rosco del día #1 · 31/10/2026");
    expect(lines[1]).toBe("✅ 13 · ❌ 5 · ↻ 4 · 🏆 130 puntos");
    expect(Array.from(lines[2])).toHaveLength(13);
    expect(Array.from(lines[3])).toHaveLength(13);
    expect(Array.from(lines[2])).toEqual(Array.from({ length: 13 }, () => "🟩"));
    expect(Array.from(lines[3])).toEqual([
      ...Array.from({ length: 5 }, () => "🟥"),
      ...Array.from({ length: 4 }, () => "🟦"),
      ...Array.from({ length: 4 }, () => "⬜")
    ]);
    expect(lines[4]).toBe("🔥 Racha: 4 días");
    expect(lines[5]).toBe(SHARE_URL);
    const text = lines.join("\n");
    expect(text).not.toContain("Pregunta");
    expect(text).not.toContain("Opción");
    expect(text).not.toContain("Explicación");
    expect(buildDailyShareText(result, 1).split("\n")[4]).toBe("🔥 Racha: 1 día");
    expect(buildDailyShareText(result, 0).split("\n")[4]).toBe("🔥 Racha: 0 días");
  });
});

describe("Rosco del día · almacenamiento", () => {
  it("usa una clave propia, hace ida y vuelta y no lanza si el navegador falla", () => {
    expect(STORAGE_KEYS.daily.startsWith("roscodex-")).toBe(true);
    const store = crearAlmacenFalso();
    vi.stubGlobal("localStorage", store);
    const data = startDaily(emptyDaily(), "2026-10-31");
    saveDaily(data);
    expect(loadDaily()).toEqual(data);
    vi.stubGlobal("localStorage", { ...store, getItem: () => { throw new Error("Bloqueado"); } });
    expect(() => loadDaily()).not.toThrow();
    expect(loadDaily()).toEqual(emptyDaily());
  });
});
