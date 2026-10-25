import { describe, expect, it } from "vitest";
import { advance, answerCurrent, createGameState, finish, isTimed, passCurrent, resumeAfterPause, type GameState } from "./gameState";
import { currentTip, tutorialTips, type TutorialTip } from "./tutorial";
import { roscoDePrueba } from "./test/fixtures";

const guiada = () => createGameState("beginner", roscoDePrueba(), 1_000, "guided");
const vistos = (...tips: TutorialTip[]) => new Set<TutorialTip>(tips);

describe("modos de partida", () => {
  it("con reloj por defecto", () => {
    const partida = createGameState("normal", roscoDePrueba("normal"), 1_000);
    expect(partida.mode).toBe("timed");
    expect(isTimed(partida)).toBe(true);
    expect(partida.endAt).toBe(1_000 + 300_000);
  });

  it.each(["practice", "guided"] as const)("%s no tiene reloj y la pausa no cambia nada", (mode) => {
    const partida = createGameState("beginner", roscoDePrueba(), 1_000, mode);
    expect(isTimed(partida)).toBe(false);
    expect(partida.endAt).toBe(Number.POSITIVE_INFINITY);
    expect(resumeAfterPause(partida, 5_000)).toBe(partida);
  });
});

describe("currentTip (partida guiada)", () => {
  it("no hay consejo sin partida o con la partida terminada", () => {
    expect(currentTip(null, vistos())).toBeNull();
    expect(currentTip(finish(guiada(), "complete"), vistos())).toBeNull();
  });

  it("sigue el orden rosco → responder → pasapalabra", () => {
    const partida = guiada();
    expect(currentTip(partida, vistos())).toBe("rosco");
    expect(currentTip(partida, vistos("rosco"))).toBe("answer");
    expect(currentTip(partida, vistos("rosco", "answer"))).toBe("pass");
    expect(currentTip(partida, vistos("rosco", "answer", "pass"))).toBeNull();
  });

  it("«Responder» desaparece al contestar aunque no se pulse Entendido", () => {
    const respondida = advance(answerCurrent(guiada(), "a").state);
    expect(currentTip(respondida, vistos("rosco"))).toBe("pass");
  });

  it("«Pasapalabra» desaparece al pasar", () => {
    const pasada = advance(passCurrent(advance(answerCurrent(guiada(), "b").state)));
    expect(currentTip(pasada, vistos("rosco"))).toBeNull();
  });

  it("«Segunda vuelta» aparece solo en la segunda vuelta", () => {
    let partida: GameState = passCurrent(guiada());
    partida = advance(partida);
    while (partida.round === 1) partida = advance(answerCurrent(partida, "a").state);
    expect(partida.round).toBe(2);
    expect(currentTip(partida, vistos("rosco", "answer", "pass"))).toBe("round2");
    expect(currentTip(partida, vistos("rosco", "answer", "pass", "round2"))).toBeNull();
  });

  it("todos los consejos tienen título y texto", () => {
    for (const tip of Object.values(tutorialTips)) {
      expect(tip.title.length).toBeGreaterThan(0);
      expect(tip.text.length).toBeGreaterThan(20);
    }
  });
});
