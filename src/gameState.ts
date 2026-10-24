import { difficultyConfig, emptyStatuses, type Difficulty, type Question, type RoscoStatus } from "./game";

export type FeedbackKind = "" | "is-correct" | "is-wrong" | "is-passed";
export type FinishReason = "time" | "complete";
export type GameMode = "timed" | "practice" | "guided";

export interface GameState {
  difficulty: Difficulty;
  questions: Question[];
  queue: number[];
  deferred: number[];
  currentIndex: number | null;
  round: 1 | 2;
  score: number;
  correct: number;
  wrong: number;
  passed: number;
  statuses: Record<string, RoscoStatus>;
  endAt: number;
  acceptingInput: boolean;
  finished: boolean;
  finishReason: FinishReason | null;
  feedback: { text: string; kind: FeedbackKind };
  selectedOptionId: string | null;
  mode: GameMode;
}

export function createGameState(difficulty: Difficulty, questions: Question[], now: number, mode: GameMode = "timed"): GameState {
  const [firstIndex, ...queue] = questions.map((_, index) => index);
  return {
    difficulty, questions, queue, deferred: [], currentIndex: firstIndex ?? null, round: 1,
    score: 0, correct: 0, wrong: 0, passed: 0,
    statuses: firstIndex === undefined ? emptyStatuses() : { ...emptyStatuses(), [questions[firstIndex].letter]: "active" },
    endAt: mode === "timed" ? now + difficultyConfig[difficulty].seconds * 1000 : Number.POSITIVE_INFINITY,
    acceptingInput: firstIndex !== undefined, finished: false, finishReason: null,
    feedback: { text: "", kind: "" }, selectedOptionId: null, mode
  };
}

export function isTimed(state: GameState): boolean {
  return state.mode === "timed";
}

export function answerCurrent(state: GameState, optionId: string): { state: GameState; isCorrect: boolean } {
  if (state.finished || !state.acceptingInput || state.currentIndex === null) return { state, isCorrect: false };
  const question = state.questions[state.currentIndex];
  if (!question) return { state, isCorrect: false };
  const isCorrect = optionId === question.correctOptionId;
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  return {
    isCorrect,
    state: {
      ...state, acceptingInput: false, selectedOptionId: optionId,
      statuses: { ...state.statuses, [question.letter]: isCorrect ? "correct" : "wrong" },
      score: state.score + (isCorrect ? 10 : 0), correct: state.correct + (isCorrect ? 1 : 0),
      wrong: state.wrong + (isCorrect ? 0 : 1),
      feedback: { text: isCorrect ? "✓ ¡Correcto! +10 puntos" : `✕ Era ${correctOption?.text ?? "la opción correcta"}`, kind: isCorrect ? "is-correct" : "is-wrong" }
    }
  };
}

export function passCurrent(state: GameState): GameState {
  if (state.finished || !state.acceptingInput || state.currentIndex === null) return state;
  const question = state.questions[state.currentIndex];
  if (!question) return state;
  return {
    ...state, acceptingInput: false, selectedOptionId: null,
    statuses: { ...state.statuses, [question.letter]: "passed" },
    deferred: state.round === 1 ? [...state.deferred, state.currentIndex] : state.deferred,
    passed: state.passed + 1,
    feedback: { text: "↻ Pasapalabra — volveremos a esta letra", kind: "is-passed" }
  };
}

export function advance(state: GameState): GameState {
  if (state.finished || state.currentIndex === null) return state;
  let queue = [...state.queue];
  let deferred = [...state.deferred];
  let round = state.round;
  if (!queue.length && deferred.length && round === 1) { queue = deferred; deferred = []; round = 2; }
  if (!queue.length) {
    return { ...finish({ ...state, deferred }, "complete"), currentIndex: null };
  }
  const [nextIndex, ...remaining] = queue;
  const next = state.questions[nextIndex];
  if (!next) return state;
  return {
    ...state, queue: remaining, deferred, round, currentIndex: nextIndex,
    statuses: { ...state.statuses, [next.letter]: "active" }, acceptingInput: true,
    feedback: { text: "", kind: "" }, selectedOptionId: null
  };
}

export function finish(state: GameState, reason: FinishReason): GameState {
  // Puede llegar en mitad de la transición entre preguntas (acceptingInput false): igualmente termina.
  if (state.finished) return state;
  const question = state.currentIndex === null ? undefined : state.questions[state.currentIndex];
  const statuses = question && state.statuses[question.letter] === "active"
    ? { ...state.statuses, [question.letter]: "expired" as RoscoStatus } : state.statuses;
  return { ...state, statuses, acceptingInput: false, finished: true, finishReason: reason, feedback: { text: "", kind: "" } };
}

/** Reanuda tras una pausa (modal «¿Abandonar la partida?»): el reloj recupera el tiempo que estuvo parado. */
export function resumeAfterPause(state: GameState, pausedMs: number): GameState {
  if (!isTimed(state) || state.finished || !(pausedMs > 0)) return state;
  return { ...state, endAt: state.endAt + pausedMs };
}
