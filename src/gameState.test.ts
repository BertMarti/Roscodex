import { beforeEach, describe, expect, it, vi } from "vitest";
import { difficultyConfig, LETTERS } from "./game";
import type { Difficulty, Question, QuestionPack, QuestionRule } from "./game";
import { advance, answerCurrent, createGameState, finish, passCurrent, resumeAfterPause } from "./gameState";

const AHORA = 1_000_000;

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

function partidaNormal(porLetra = 1) {
  return createGameState("normal", makePack("normal", porLetra).questions, AHORA);
}

beforeEach(() => {
  vi.stubGlobal("localStorage", crearAlmacenFalso());
});

describe("createGameState", () => {
  it("activa la primera pregunta, encola el resto y fija el fin de la partida", () => {
    const state = createGameState("normal", makePack("normal", 1).questions, AHORA);
    expect(state.currentIndex).toBe(0);
    expect(state.queue).toEqual(LETTERS.slice(1).map((_, index) => index + 1));
    expect(state.deferred).toEqual([]);
    expect(state.round).toBe(1);
    expect(state.endAt).toBe(AHORA + difficultyConfig.normal.seconds * 1000);
    expect(state.score).toBe(0);
    expect(state.correct).toBe(0);
    expect(state.wrong).toBe(0);
    expect(state.passed).toBe(0);
    expect(state.acceptingInput).toBe(true);
    expect(state.finished).toBe(false);
    expect(state.finishReason).toBeNull();
    expect(state.feedback).toEqual({ text: "", kind: "" });
    expect(state.selectedOptionId).toBeNull();
    expect(state.statuses.A).toBe("active");
  });

  it("sin preguntas deja la partida sin pregunta activa ni entrada", () => {
    const state = createGameState("beginner", [], AHORA);
    expect(state.currentIndex).toBeNull();
    expect(state.queue).toEqual([]);
    expect(state.acceptingInput).toBe(false);
    expect(state.endAt).toBe(AHORA + difficultyConfig.beginner.seconds * 1000);
  });
});

describe("answerCurrent", () => {
  it("suma 10 puntos y marca la letra como correcta al acertar", () => {
    const state = partidaNormal();
    const resultado = answerCurrent(state, "a");
    expect(resultado.isCorrect).toBe(true);
    expect(resultado.state.score).toBe(10);
    expect(resultado.state.correct).toBe(1);
    expect(resultado.state.wrong).toBe(0);
    expect(resultado.state.statuses.A).toBe("correct");
    expect(resultado.state.acceptingInput).toBe(false);
    expect(resultado.state.feedback.kind).toBe("is-correct");
    expect(resultado.state.feedback.text).toContain("+10");
    expect(resultado.state.selectedOptionId).toBe("a");
  });

  it("suma fallo, marca la letra como wrong y explica la opción correcta", () => {
    const state = partidaNormal();
    const resultado = answerCurrent(state, "b");
    expect(resultado.isCorrect).toBe(false);
    expect(resultado.state.score).toBe(0);
    expect(resultado.state.wrong).toBe(1);
    expect(resultado.state.statuses.A).toBe("wrong");
    expect(resultado.state.acceptingInput).toBe(false);
    expect(resultado.state.feedback.kind).toBe("is-wrong");
    expect(resultado.state.feedback.text).toContain("Opción A");
    expect(resultado.state.selectedOptionId).toBe("b");
  });

  it("ignora answerCurrent si no está aceptando entrada", () => {
    const state = partidaNormal();
    const respondida = answerCurrent(state, "a").state;
    const resultado = answerCurrent(respondida, "b");
    expect(resultado.state).toBe(respondida);
    expect(resultado.isCorrect).toBe(false);
  });

  it("ignora passCurrent si no está aceptando entrada", () => {
    const state = partidaNormal();
    const respondida = answerCurrent(state, "a").state;
    expect(passCurrent(respondida)).toBe(respondida);
  });

  it("ignora answerCurrent y passCurrent si la partida ya terminó", () => {
    const state = partidaNormal();
    const terminada = finish(state, "time");
    expect(answerCurrent(terminada, "a").state).toBe(terminada);
    expect(passCurrent(terminada)).toBe(terminada);
  });
});

describe("passCurrent", () => {
  it("en la vuelta 1 encola la letra como diferida y la marca passed", () => {
    const state = partidaNormal(1);
    const trasPasar = passCurrent(state);
    expect(trasPasar.statuses.A).toBe("passed");
    expect(trasPasar.deferred).toEqual([0]);
    expect(trasPasar.passed).toBe(1);
    expect(trasPasar.acceptingInput).toBe(false);
    expect(trasPasar.feedback.kind).toBe("is-passed");
  });

  it("en la vuelta 2 no vuelve a encolar la letra pasada", () => {
    let actual = partidaNormal(1);
    for (let i = 0; i < LETTERS.length; i += 1) {
      actual = advance(passCurrent(actual));
    }
    expect(actual.round).toBe(2);
    expect(actual.deferred).toEqual([]);
    expect(actual.queue).toHaveLength(LETTERS.length - 1);
    const letra = actual.questions[actual.currentIndex!].letter;
    const trasPasar = passCurrent(actual);
    expect(trasPasar.deferred).toEqual([]);
    expect(trasPasar.statuses[letra]).toBe("passed");
    expect(trasPasar.passed).toBe(LETTERS.length + 1);
  });
});

describe("advance", () => {
  it("pasa a la siguiente pregunta con estado active y limpia el feedback", () => {
    const state = partidaNormal();
    const trasRespuesta = answerCurrent(state, "a").state;
    const siguiente = advance(trasRespuesta);
    expect(siguiente.currentIndex).toBe(1);
    expect(siguiente.queue).toEqual(LETTERS.slice(2).map((_, index) => index + 2));
    expect(siguiente.statuses.A).toBe("correct");
    expect(siguiente.statuses.B).toBe("active");
    expect(siguiente.acceptingInput).toBe(true);
    expect(siguiente.feedback).toEqual({ text: "", kind: "" });
    expect(siguiente.selectedOptionId).toBeNull();
  });

  it("cuando la cola se vacía arranca la vuelta 2 con las diferidas", () => {
    let actual = partidaNormal(1);
    actual = advance(passCurrent(actual));
    for (let i = 1; i < LETTERS.length - 1; i += 1) {
      actual = advance(answerCurrent(actual, "a").state);
    }
    const vuelta2 = advance(answerCurrent(actual, "a").state);
    expect(vuelta2.round).toBe(2);
    expect(vuelta2.currentIndex).toBe(0);
    expect(vuelta2.deferred).toEqual([]);
    expect(vuelta2.queue).toEqual([]);
    expect(vuelta2.statuses.A).toBe("active");
    expect(vuelta2.statuses.Z).toBe("correct");
    expect(vuelta2.acceptingInput).toBe(true);
  });

  it("sin cola ni diferidas termina la partida como completa", () => {
    let actual = partidaNormal(1);
    for (let i = 0; i < LETTERS.length - 1; i += 1) {
      actual = advance(answerCurrent(actual, "a").state);
    }
    const final = advance(answerCurrent(actual, "a").state);
    expect(final.finished).toBe(true);
    expect(final.finishReason).toBe("complete");
    expect(final.currentIndex).toBeNull();
    expect(final.acceptingInput).toBe(false);
    expect(advance(final)).toBe(final);
  });
});

describe("finish", () => {
  it("marca la letra activa como expired y cierra la partida por tiempo", () => {
    const state = partidaNormal(1);
    const terminada = finish(state, "time");
    expect(terminada.statuses.A).toBe("expired");
    expect(terminada.finished).toBe(true);
    expect(terminada.finishReason).toBe("time");
    expect(terminada.acceptingInput).toBe(false);
    expect(terminada.feedback).toEqual({ text: "", kind: "" });
  });

  it("durante la transición no cambia la letra ya respondida", () => {
    const state = partidaNormal(1);
    const trasRespuesta = answerCurrent(state, "a").state;
    const terminada = finish(trasRespuesta, "time");
    expect(terminada.statuses.A).toBe("correct");
    expect(terminada.finished).toBe(true);
    expect(terminada.finishReason).toBe("time");
    expect(terminada.acceptingInput).toBe(false);
  });

  it("es idempotente si la partida ya había terminado", () => {
    const state = partidaNormal(1);
    const terminada = finish(state, "time");
    expect(finish(terminada, "complete")).toBe(terminada);
  });
});

describe("inmutabilidad", () => {
  it("no modifica el estado original tras answerCurrent, passCurrent ni advance", () => {
    const state = partidaNormal(2);
    const original = structuredClone(state);

    const respondida = answerCurrent(state, "a").state;
    expect(state).toEqual(original);
    expect(respondida).not.toBe(state);
    expect(respondida.statuses).not.toBe(state.statuses);

    const pasada = passCurrent(state);
    expect(state).toEqual(original);
    expect(pasada.deferred).not.toBe(state.deferred);

    const siguiente = advance(state);
    expect(state).toEqual(original);
    expect(siguiente.queue).not.toBe(state.queue);
  });
});

describe("partida completa simulada", () => {
  it("acertar las 26 letras con advance entre medias suma 260 puntos y termina completa", () => {
    let state = partidaNormal();
    for (let i = 0; i < LETTERS.length; i += 1) {
      expect(state.finished).toBe(false);
      state = advance(answerCurrent(state, "a").state);
    }
    expect(state.score).toBe(260);
    expect(state.correct).toBe(26);
    expect(state.wrong).toBe(0);
    expect(state.passed).toBe(0);
    expect(state.finished).toBe(true);
    expect(state.finishReason).toBe("complete");
    expect(state.currentIndex).toBeNull();
  });
});

describe("resumeAfterPause", () => {
  it("devuelve al reloj el tiempo que estuvo en pausa", () => {
    const estado = createGameState("normal", makePack("normal", 1).questions, AHORA);
    expect(resumeAfterPause(estado, 15_000).endAt).toBe(estado.endAt + 15_000);
  });

  it("no cambia nada si la pausa no es positiva o la partida terminó", () => {
    const estado = createGameState("normal", makePack("normal", 1).questions, AHORA);
    expect(resumeAfterPause(estado, 0)).toBe(estado);
    const terminado = finish(estado, "time");
    expect(resumeAfterPause(terminado, 5_000)).toBe(terminado);
  });
});
