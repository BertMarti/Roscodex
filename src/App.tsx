import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  choosePack,
  difficultyConfig,
  emptyStatuses,
  formatTime,
  LETTERS,
  loadQuestionPacks,
  loadQuestionHistory,
  saveQuestionHistory,
  shuffle,
  type Difficulty,
  type Question,
  type QuestionPack,
  type RoscoStatus
} from "./game";
import { playSound } from "./audio";

type Screen = "home" | "game";
type Modal = "credits" | "exhausted" | "results" | null;
type FeedbackKind = "" | "is-correct" | "is-wrong" | "is-passed";

interface GameState {
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
  finishReason: "time" | "complete" | null;
  feedback: { text: string; kind: FeedbackKind };
  selectedOptionId: string | null;
}

const difficultyOrder: Difficulty[] = ["beginner", "normal", "hard", "extreme"];
const baseUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [packs, setPacks] = useState<QuestionPack[] | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [exhaustedDifficulty, setExhaustedDifficulty] = useState<Difficulty | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("roscodex-audio") !== "off";
    } catch {
      return true;
    }
  });
  const [now, setNow] = useState(() => Date.now());
  const transitionRef = useRef<number | null>(null);

  const question = useMemo(() => {
    if (!game || game.currentIndex === null) return null;
    return game.questions[game.currentIndex] ?? null;
  }, [game]);

  const clearTransition = useCallback(() => {
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    transitionRef.current = null;
  }, []);

  const finishGame = useCallback((reason: "time" | "complete") => {
    clearTransition();
    setGame((previous) => {
      if (!previous || previous.finished) return previous;
      const statuses = { ...previous.statuses };
      if (previous.currentIndex !== null) {
        const activeQuestion = previous.questions[previous.currentIndex];
        if (activeQuestion && statuses[activeQuestion.letter] === "active") statuses[activeQuestion.letter] = "expired";
      }
      return {
        ...previous,
        statuses,
        acceptingInput: false,
        finished: true,
        finishReason: reason,
        feedback: { text: "", kind: "" }
      };
    });
    playSound("finish", soundEnabled);
  }, [clearTransition, soundEnabled]);

  useEffect(() => {
    if (!game || game.finished) return undefined;
    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (currentNow >= game.endAt) finishGame("time");
    }, 250);
    return () => window.clearInterval(interval);
  }, [finishGame, game?.endAt, game?.finished]);

  useEffect(() => {
    if (game?.finished) setModal("results");
  }, [game?.finished]);

  useEffect(() => {
    try {
      localStorage.setItem("roscodex-audio", soundEnabled ? "on" : "off");
    } catch {
      // Preferimos mantener el ajuste en memoria si el almacenamiento no está disponible.
    }
  }, [soundEnabled]);

  useEffect(() => () => clearTransition(), [clearTransition]);

  const nextQuestion = useCallback(() => {
    setGame((previous) => {
      if (!previous || previous.finished) return previous;
      let queue = [...previous.queue];
      let deferred = [...previous.deferred];
      let round = previous.round;

      if (!queue.length && deferred.length && round === 1) {
        queue = deferred;
        deferred = [];
        round = 2;
      }

      if (!queue.length) {
        playSound("finish", soundEnabled);
        return { ...previous, currentIndex: null, acceptingInput: false, finished: true, finishReason: "complete", deferred };
      }

      const [nextIndex, ...remaining] = queue;
      const next = previous.questions[nextIndex];
      const statuses = { ...previous.statuses, [next.letter]: "active" as RoscoStatus };
      return {
        ...previous,
        queue: remaining,
        deferred,
        round: round as 1 | 2,
        currentIndex: nextIndex,
        statuses,
        acceptingInput: true,
        feedback: { text: "", kind: "" },
        selectedOptionId: null
      };
    });
  }, [soundEnabled]);

  const scheduleNext = useCallback(() => {
    clearTransition();
    transitionRef.current = window.setTimeout(() => {
      transitionRef.current = null;
      nextQuestion();
    }, 850);
  }, [clearTransition, nextQuestion]);

  const startGame = useCallback(async (difficulty: Difficulty) => {
    clearTransition();
    setLoadError("");
    setLoading(true);
    playSound("tap", soundEnabled);
    try {
      const availablePacks = packs ?? await loadQuestionPacks();
      if (!packs) setPacks(availablePacks);
      const selected = choosePack(availablePacks, difficulty);
      const indices = selected.questions.map((_, index) => index);
      const [firstIndex, ...queue] = indices;
      setGame({
        difficulty,
        questions: selected.questions,
        queue,
        deferred: [],
        currentIndex: firstIndex,
        round: 1,
        score: 0,
        correct: 0,
        wrong: 0,
        passed: 0,
        statuses: { ...emptyStatuses(), [selected.questions[firstIndex].letter]: "active" },
        endAt: Date.now() + difficultyConfig[difficulty].seconds * 1000,
        acceptingInput: true,
        finished: false,
        finishReason: null,
        feedback: { text: "", kind: "" },
        selectedOptionId: null
      });
      setNow(Date.now());
      setModal(null);
      setExhaustedDifficulty(null);
      setScreen("game");
    } catch (error) {
      if (error instanceof Error && error.name === "QuestionBankExhaustedError") {
        setExhaustedDifficulty(difficulty);
        setModal("exhausted");
      } else {
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar el banco local.");
      }
    } finally {
      setLoading(false);
    }
  }, [clearTransition, packs, soundEnabled]);

  const answerQuestion = useCallback((optionId: string) => {
    if (!game || !question || !game.acceptingInput) return;
    const isCorrect = optionId === question.correctOptionId;
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);
    setGame((previous) => {
      if (!previous || !previous.acceptingInput || previous.currentIndex === null) return previous;
      return {
        ...previous,
        acceptingInput: false,
        selectedOptionId: optionId,
        statuses: { ...previous.statuses, [question.letter]: isCorrect ? "correct" : "wrong" },
        score: previous.score + (isCorrect ? 10 : 0),
        correct: previous.correct + (isCorrect ? 1 : 0),
        wrong: previous.wrong + (isCorrect ? 0 : 1),
        feedback: {
          text: isCorrect ? "✓ ¡Correcto! +10 puntos" : `✕ Era ${correctOption?.text ?? "la opción correcta"}`,
          kind: isCorrect ? "is-correct" : "is-wrong"
        }
      };
    });
    playSound(isCorrect ? "correct" : "wrong", soundEnabled);
    scheduleNext();
  }, [game, question, scheduleNext, soundEnabled]);

  const passQuestion = useCallback(() => {
    if (!game || !question || !game.acceptingInput) return;
    setGame((previous) => {
      if (!previous || !previous.acceptingInput || previous.currentIndex === null) return previous;
      return {
        ...previous,
        acceptingInput: false,
        selectedOptionId: null,
        statuses: { ...previous.statuses, [question.letter]: "passed" },
        deferred: previous.round === 1 ? [...previous.deferred, previous.currentIndex] : previous.deferred,
        passed: previous.passed + 1,
        feedback: { text: "↻ Pasapalabra — volveremos a esta letra", kind: "is-passed" }
      };
    });
    playSound("pass", soundEnabled);
    scheduleNext();
  }, [game, question, scheduleNext, soundEnabled]);

  const showHome = useCallback(() => {
    clearTransition();
    setGame(null);
    setExhaustedDifficulty(null);
    setModal(null);
    setScreen("home");
  }, [clearTransition]);

  const resetRotation = useCallback(() => {
    const difficulty = game?.difficulty ?? exhaustedDifficulty;
    if (!difficulty) return;
    const history = loadQuestionHistory();
    history[difficulty] = [];
    saveQuestionHistory(history);
    setModal(null);
    void startGame(difficulty);
  }, [exhaustedDifficulty, game, startGame]);

  const remaining = game ? Math.max(0, game.endAt - now) : 0;
  const timeIsDangerous = remaining <= 30_000;

  return (
    <>
      <div className="scene-bg" aria-hidden="true"><SpriteField /></div>
      <main className="app-shell">
        {screen === "home" ? (
          <HomeScreen
            loading={loading}
            error={loadError}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
            onStart={startGame}
            onOpenCredits={() => setModal("credits")}
          />
        ) : (
          <GameScreen
            game={game}
            question={question}
            remaining={remaining}
            timeIsDangerous={timeIsDangerous}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
            onAnswer={answerQuestion}
            onPass={passQuestion}
          />
        )}
      </main>
      {modal === "credits" && <CreditsModal onClose={() => setModal(null)} />}
      {modal === "exhausted" && <ExhaustedModal onClose={showHome} onReset={resetRotation} />}
      {modal === "results" && game && <ResultsModal game={game} onRestart={() => void startGame(game.difficulty)} onHome={showHome} />}
    </>
  );
}

function SpriteField() {
  return (
    <>
      <div id="sprite-field" className="sprite-field">
        {Array.from({ length: 25 }, (_, index) => {
          const id = String(index + 1).padStart(3, "0");
          return <div className="sprite-tile" key={id}><img src={baseUrl(`assets/sprites/${id}.png`)} alt="" /></div>;
        })}
      </div>
      <div className="scene-bg__wash" />
      <div className="scene-bg__scanlines" />
      <div className="scene-bg__vignette" />
    </>
  );
}

interface HomeScreenProps {
  loading: boolean;
  error: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onStart: (difficulty: Difficulty) => void;
  onOpenCredits: () => void;
}

function HomeScreen({ loading, error, soundEnabled, onToggleSound, onStart, onOpenCredits }: HomeScreenProps) {
  return (
    <section className="screen screen-home" aria-labelledby="home-title">
      <header className="brand-lockup">
        <div className="brand-orb" aria-hidden="true"><span>RX</span></div>
        <div>
          <p className="eyebrow">FAN GAME // OFFLINE-FIRST</p>
          <h1 id="home-title"><span>ROSCO</span><b>DEX</b></h1>
        </div>
      </header>
      <p className="tagline">El desafío de las letras</p>

      <section className="panel setup-panel" aria-labelledby="setup-title">
        <div className="panel-heading"><div><span className="panel-kicker">ENTRENADOR // 01</span><h2 id="setup-title">Crear partida</h2></div><span className="panel-mark" aria-hidden="true">✦</span></div>
        <div className="panel-rule" />
        <p className="field-label">Elige tu dificultad</p>
        <div className="difficulty-grid">
          {difficultyOrder.map((difficulty, index) => (
            <button className={`difficulty-card difficulty-card--${["green", "blue", "orange", "red"][index]}`} data-difficulty={difficulty} type="button" key={difficulty} disabled={loading} onClick={() => onStart(difficulty)}>
              <span className="difficulty-card__badge">0{index + 1}</span>
              <strong>{difficultyConfig[difficulty].label}</strong>
              <small>{difficultyConfig[difficulty].description}</small>
            </button>
          ))}
        </div>
        {loading && <p className="inline-status" role="status">CARGANDO BANCO LOCAL...</p>}
        {error && <p className="inline-status inline-status--error" role="alert">{error}</p>}
      </section>

      <div className="fan-note">
        <span className="fan-note__icon" aria-hidden="true"><img src={baseUrl("assets/spritecollab/pikachu-happy.png")} alt="" /></span>
        <div><strong>Proyecto fan no oficial</strong><p>Pokémon y sus personajes pertenecen a sus respectivos titulares.</p></div>
        <button id="open-credits" className="link-button" type="button" onClick={onOpenCredits}>Fuentes y créditos</button>
        <button className="sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "♫ SONIDO" : "× SILENCIO"}</button>
      </div>
      <p className="home-footer">SIN CUENTAS · SIN PUBLICIDAD · FUNCIONA OFFLINE</p>
    </section>
  );
}

interface GameScreenProps {
  game: GameState | null;
  question: Question | null;
  remaining: number;
  timeIsDangerous: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAnswer: (optionId: string) => void;
  onPass: () => void;
}

function GameScreen({ game, question, remaining, timeIsDangerous, soundEnabled, onToggleSound, onAnswer, onPass }: GameScreenProps) {
  const config = game ? difficultyConfig[game.difficulty] : difficultyConfig.normal;
  return (
    <section className="screen screen-game" aria-labelledby="game-title">
      <header className="game-header">
        <div className="brand-mini"><div className="brand-orb brand-orb--small" aria-hidden="true"><span>RX</span></div><div><p className="eyebrow">ROSCODEX // <span>{config.label}</span></p><h2 id="game-title">Completa el rosco</h2></div></div>
        <div className={`timer-box${timeIsDangerous ? " is-danger" : ""}`} aria-live="polite"><span className="timer-box__label">TIEMPO</span><span className="timer-box__value">{formatTime(remaining)}</span></div>
      </header>
      <div className="game-meta"><span>VUELTA {game?.round ?? 1} · LETRA {question?.letter ?? "A"}</span><span><b>{game?.score ?? 0}</b> PUNTOS</span></div>
      <Rosco statuses={game?.statuses ?? emptyStatuses()} questions={game?.questions ?? []} />
      <div className="rosco-legend" aria-label="Leyenda de estados"><Legend status="pending" label="Pendiente" /><Legend status="correct" label="Acierto" /><Legend status="wrong" label="Fallada" /><Legend status="passed" label="Pasada" /><Legend status="expired" label="Tiempo" /></div>
      <QuestionCard game={game} question={question} onAnswer={onAnswer} onPass={onPass} />
      <button className="game-sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? "Desactivar sonido" : "Activar sonido"}>{soundEnabled ? "♫" : "×"}</button>
    </section>
  );
}

function Rosco({ statuses, questions }: { statuses: Record<string, RoscoStatus>; questions: Question[] }) {
  const roscoLetters = questions.length ? questions.map((item) => item.letter) : LETTERS;
  return <div className="rosco" aria-label="Estado del rosco">{roscoLetters.map((letter, index) => {
    const angle = (index / roscoLetters.length) * Math.PI * 2 - Math.PI / 2;
    const status = statuses[letter] ?? "pending";
    return <div className={`rosco-letter is-${status}`} key={letter} role="img" aria-label={`${letter}: ${status}`} style={{ left: `${50 + Math.cos(angle) * 46}%`, top: `${50 + Math.sin(angle) * 46}%` }}><span className="rosco-letter__glyph">{letter}</span></div>;
  })}</div>;
}

function Legend({ status, label }: { status: RoscoStatus; label: string }) {
  return <span><i className={`rosco-legend__dot rosco-legend__dot--${status}`} />{label}</span>;
}

function QuestionCard({ game, question, onAnswer, onPass }: { game: GameState | null; question: Question | null; onAnswer: (optionId: string) => void; onPass: () => void }) {
  const options = useMemo(() => question ? shuffle([...question.options]) : [], [question]);
  const correctId = question?.correctOptionId;
  return <section className="panel question-card" aria-live="polite">
    <div className="question-card__topline"><span className="panel-kicker">DESAFÍO ACTIVO</span><span className="question-rule">{question?.rule === "contains" ? `CONTIENE LA LETRA ${question.letter}` : `EMPIEZA POR LA LETRA ${question?.letter ?? "A"}`}</span></div>
    <h3>{question?.question ?? "Cargando pregunta..."}</h3>
    <div className="answers">{options.map((option) => {
      const isCorrect = option.id === correctId;
      const isSelected = option.id === game?.selectedOptionId;
      const resultClass = game?.selectedOptionId ? (isCorrect ? " is-correct" : isSelected ? " is-wrong" : "") : "";
      return <button className={`answer-button${resultClass}`} type="button" key={option.id} disabled={!game?.acceptingInput} onClick={() => onAnswer(option.id)}>{option.text}</button>;
    })}</div>
    <button className="pass-button" type="button" disabled={!game?.acceptingInput} onClick={onPass}>↻ Pasapalabra</button>
    <p className={`feedback ${game?.feedback.kind ?? ""}`} role="status">{game?.feedback.text ?? ""}</p>
  </section>;
}

function ModalShell({ children, onClose, className = "" }: { children: ReactNode; onClose?: () => void; className?: string }) {
  return <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><section className={`modal ${className}`} role="dialog" aria-modal="true">{onClose && <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>}{children}</section></div>;
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  return <ModalShell onClose={onClose}><p className="eyebrow">INFO // FUENTES</p><h2>Proyecto fan</h2><p>Roscodex es una demo fan no oficial creada con fines educativos y de experimentación. No está afiliada, patrocinada ni aprobada por Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company.</p><p>Pokémon y los nombres de sus personajes pertenecen a sus respectivos titulares.</p><h3>Fuentes consultadas</h3><ul className="source-list"><li><a href="https://pokeapi.co/" target="_blank" rel="noreferrer">PokéAPI</a> — datos estructurados.</li><li><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noreferrer">PokéAPI Sprites</a> — sprites cacheados.</li><li><a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noreferrer">SpriteCollab</a> — retrato decorativo atribuido a su comunidad bajo CC BY-NC 4.0.</li><li><a href="https://fonts.google.com/specimen/Press+Start+2P" target="_blank" rel="noreferrer">Press Start 2P</a> — tipografía de interfaz.</li><li>Efectos de sonido: tonos 8-bit generados localmente con Web Audio.</li></ul><p className="modal__fine-print">La partida no consulta APIs en tiempo de ejecución. Los recursos necesarios se sirven desde archivos locales.</p></ModalShell>;
}

function ExhaustedModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  return <ModalShell><p className="eyebrow">BANCO COMPLETADO</p><h2>No quedan preguntas nuevas</h2><p>Has recorrido todas las preguntas disponibles de esta dificultad. La demo no las repetirá automáticamente.</p><button className="primary-button" type="button" onClick={onReset}>Reiniciar rotación</button><button className="secondary-button" type="button" onClick={onClose}>Cambiar dificultad</button></ModalShell>;
}

function ResultsModal({ game, onRestart, onHome }: { game: GameState; onRestart: () => void; onHome: () => void }) {
  return <ModalShell><p className="eyebrow">PARTIDA TERMINADA</p><h2>{game.finishReason === "time" ? "Tiempo agotado" : "Reto completado"}</h2><div className="result-score"><span>{game.score}</span><small> PUNTOS</small></div><div className="result-grid"><div><strong>{game.correct}</strong><span>Correctas</span></div><div><strong>{game.wrong}</strong><span>Falladas</span></div><div><strong>{game.passed}</strong><span>Pasadas</span></div></div><button className="primary-button" type="button" onClick={onRestart}>Jugar de nuevo</button><button className="secondary-button" type="button" onClick={onHome}>Cambiar dificultad</button></ModalShell>;
}

export default App;
