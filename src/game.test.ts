import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  choosePack,
  emptyStatuses,
  formatTime,
  isDifficulty,
  LETTERS,
  loadQuestionHistory,
  QuestionBankExhaustedError,
  saveQuestionHistory,
  shuffle
} from "./game";
import type { Difficulty, Question, QuestionPack, QuestionRule } from "./game";

const CLAVE_V4 = "roscodex-question-history-v4";
const CLAVE_V3 = "pokereto-question-history-v3";

interface AlmacenFalso {
  mapa: Map<string, string>;
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
  removeItem(clave: string): void;
  clear(): void;
}

function crearAlmacenFalso(): AlmacenFalso {
  const mapa = new Map<string, string>();
  return {
    mapa,
    getItem: (clave) => mapa.get(clave) ?? null,
    setItem: (clave, valor) => {
      mapa.set(clave, String(valor));
    },
    removeItem: (clave) => {
      mapa.delete(clave);
    },
    clear: () => {
      mapa.clear();
    }
  };
}

function makeQuestion(letter: string, id: string, rule: QuestionRule = "starts_with"): Question {
  return {
    id,
    difficulty: "normal",
    letter,
    rule,
    question: `¿Qué Pokémon empieza por ${letter} (${id})?`,
    options: [
      { id: "a", text: `Opción A de ${id}` },
      { id: "b", text: `Opción B de ${id}` },
      { id: "c", text: `Opción C de ${id}` },
      { id: "d", text: `Opción D de ${id}` }
    ],
    correctOptionId: "a"
  };
}

function makePack(difficulty: Difficulty, porLetra: number): QuestionPack {
  const questions = LETTERS.flatMap((letter) =>
    Array.from({ length: porLetra }, (_, index) => ({
      ...makeQuestion(letter, `${letter}-${difficulty}-${index}`),
      difficulty
    }))
  );
  return { id: `pack-${difficulty}-${porLetra}`, difficulty, questions };
}

function historialVacio(): Record<Difficulty, string[]> {
  return { beginner: [], normal: [], hard: [], extreme: [] };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", crearAlmacenFalso());
});

describe("formatTime", () => {
  it("formatea minutos y segundos redondeando hacia arriba", () => {
    expect(formatTime(360_000)).toBe("06:00");
    expect(formatTime(59_001)).toBe("01:00");
    expect(formatTime(1)).toBe("00:01");
  });

  it("nunca muestra tiempo negativo", () => {
    expect(formatTime(-5_000)).toBe("00:00");
  });
});

describe("emptyStatuses", () => {
  it("deja las 26 letras pendientes", () => {
    const statuses = emptyStatuses();
    expect(Object.keys(statuses)).toEqual(LETTERS);
    expect(new Set(Object.values(statuses))).toEqual(new Set(["pending"]));
  });
});

describe("shuffle", () => {
  it("conserva la longitud y los mismos elementos", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const resultado = shuffle([...original]);
    expect(resultado).toHaveLength(original.length);
    expect([...resultado].sort((a, b) => a - b)).toEqual(original);
  });

  it("reordena sin perder ni duplicar elementos con aleatoriedad fija", () => {
    const aleatorio = vi.spyOn(Math, "random").mockReturnValue(0);
    const original = ["a", "b", "c", "d", "e"];
    const resultado = shuffle([...original]);
    expect(resultado).toHaveLength(5);
    expect([...resultado].sort()).toEqual(original);
    aleatorio.mockReturnValue(0.99);
    const otro = shuffle([...original]);
    expect([...otro].sort()).toEqual(original);
  });
});

describe("isDifficulty", () => {
  it("reconoce las cuatro claves válidas y rechaza el resto", () => {
    expect(isDifficulty("beginner")).toBe(true);
    expect(isDifficulty("normal")).toBe(true);
    expect(isDifficulty("hard")).toBe(true);
    expect(isDifficulty("extreme")).toBe(true);
    expect(isDifficulty("facil")).toBe(false);
    expect(isDifficulty("__proto__")).toBe(false);
  });
});

describe("loadQuestionHistory", () => {
  it("devuelve un historial vacío si no hay nada almacenado", () => {
    expect(loadQuestionHistory()).toEqual({});
  });

  it("devuelve un historial vacío si el JSON guardado no es válido", () => {
    localStorage.setItem(CLAVE_V4, "{esto no es json");
    expect(loadQuestionHistory()).toEqual({});
  });

  it("devuelve un historial vacío si el valor almacenado es un array", () => {
    localStorage.setItem(CLAVE_V4, JSON.stringify(["pregunta-1", "pregunta-2"]));
    expect(loadQuestionHistory()).toEqual({});
  });

  it("conserva las dificultades válidas y descarta claves o valores con mala forma", () => {
    localStorage.setItem(CLAVE_V4, JSON.stringify({
      beginner: ["A-normal-0"],
      normal: [1, 2],
      hard: "no-es-array",
      extreme: { 0: "A-extreme-0" },
      facil: ["clave-desconocida"]
    }));
    expect(loadQuestionHistory()).toEqual({ beginner: ["A-normal-0"] });
  });

  it("lee la clave antigua si no existe la actual", () => {
    localStorage.setItem(CLAVE_V3, JSON.stringify({ hard: ["H-hard-0"] }));
    expect(loadQuestionHistory()).toEqual({ hard: ["H-hard-0"] });
  });

  it("prefiere la clave actual sobre la antigua", () => {
    localStorage.setItem(CLAVE_V4, JSON.stringify({ normal: ["A-normal-0"] }));
    localStorage.setItem(CLAVE_V3, JSON.stringify({ hard: ["H-hard-0"] }));
    expect(loadQuestionHistory()).toEqual({ normal: ["A-normal-0"] });
  });
});

describe("saveQuestionHistory", () => {
  it("guarda el historial serializado en la clave actual", () => {
    saveQuestionHistory({ ...historialVacio(), normal: ["A-normal-0", "B-normal-0"] });
    expect(localStorage.getItem(CLAVE_V4)).toBe(JSON.stringify({ ...historialVacio(), normal: ["A-normal-0", "B-normal-0"] }));
  });

  it("migra y borra la clave antigua del proyecto (origen compartido)", () => {
    localStorage.setItem(CLAVE_V3, JSON.stringify({ hard: ["H-hard-0"] }));
    const historial = loadQuestionHistory();
    saveQuestionHistory(historial);
    expect(localStorage.getItem(CLAVE_V3)).toBeNull();
    expect(JSON.parse(localStorage.getItem(CLAVE_V4) ?? "{}")).toEqual({ hard: ["H-hard-0"] });
  });

  it("no lanza si el navegador bloquea el almacenamiento", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("Almacenamiento bloqueado");
      },
      removeItem: () => {},
      clear: () => {}
    });
    expect(() => saveQuestionHistory(historialVacio())).not.toThrow();
  });
});

describe("choosePack", () => {
  it("elige 26 preguntas, una por letra en orden de la A a la Z", () => {
    const seleccion = choosePack([makePack("normal", 3)], "normal");
    expect(seleccion.questions).toHaveLength(26);
    expect(seleccion.questions.map((question) => question.letter)).toEqual(LETTERS);
  });

  it("guarda los IDs elegidos y evita repetirlos en la siguiente partida", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pack = makePack("normal", 2);
    const primera = choosePack([pack], "normal");
    const idsPrimera = primera.questions.map((question) => question.id);
    expect(loadQuestionHistory().normal).toEqual(idsPrimera);

    const segunda = choosePack([pack], "normal");
    const idsSegunda = segunda.questions.map((question) => question.id);
    expect(idsSegunda).not.toEqual(idsPrimera);
    expect(idsSegunda).toEqual(LETTERS.map((letter) => `${letter}-normal-1`));
    expect(loadQuestionHistory().normal).toHaveLength(52);
  });

  it("con el banco agotado lanza QuestionBankExhaustedError con su dificultad", () => {
    const pack = makePack("normal", 1);
    choosePack([pack], "normal");
    let error: unknown = null;
    try {
      choosePack([pack], "normal");
    } catch (capturado) {
      error = capturado;
    }
    expect(error).toBeInstanceOf(QuestionBankExhaustedError);
    const fallo = error as QuestionBankExhaustedError;
    expect(fallo.name).toBe("QuestionBankExhaustedError");
    expect(fallo.difficulty).toBe("normal");
  });

  it("lanza un Error si no existe banco para la dificultad pedida", () => {
    expect(() => choosePack([makePack("normal", 2)], "hard")).toThrowError(/hard/);
  });

  it("devuelve las opciones como copias y conserva los mismos IDs", () => {
    const pack = makePack("normal", 1);
    const seleccion = choosePack([pack], "normal");
    const original = pack.questions[0];
    const elegida = seleccion.questions[0];
    expect(elegida.options.map((option) => option.id).sort()).toEqual(original.options.map((option) => option.id).sort());
    elegida.options[0].text = "Texto alterado en la copia";
    expect(original.options.some((option) => option.text === "Texto alterado en la copia")).toBe(false);
  });
});
