import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import type { ReactNode, RefObject } from "react";
import {
  choosePack,
  difficultyConfig,
  emptyStatuses,
  formatTime,
  LETTERS,
  loadQuestionPacks,
  loadQuestionHistory,
  saveQuestionHistory,
  type Difficulty,
  type Question,
  type QuestionPack,
  type RoscoStatus
} from "./game";
import { playSound } from "./audio";
import { answerCurrent, advance, createGameState, finish, passCurrent, type GameState } from "./gameState";

type Screen = "home" | "game";
type Modal = "credits" | "exhausted" | "results" | "abandon" | null;

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
  const [lastDifficulty, setLastDifficulty] = useState<Difficulty>("normal");
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("roscodex-audio") !== "off";
    } catch {
      return true;
    }
  });
  const [now, setNow] = useState(() => Date.now());
  const transitionRef = useRef<number | null>(null);
  const creditsButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
      return finish(previous, reason);
    });
  }, [clearTransition]);

  const wasFinished = useRef(false);
  useEffect(() => {
    if (game?.finished && !wasFinished.current) playSound("finish", soundEnabled);
    wasFinished.current = game?.finished ?? false;
  }, [game?.finished, soundEnabled]);

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
      return advance(previous);
    });
  }, []);

  const scheduleNext = useCallback(() => {
    clearTransition();
    transitionRef.current = window.setTimeout(() => {
      transitionRef.current = null;
      nextQuestion();
    }, 850);
  }, [clearTransition, nextQuestion]);

  const startGame = useCallback(async (difficulty: Difficulty) => {
    setLastDifficulty(difficulty);
    clearTransition();
    setLoadError("");
    setLoading(true);
    playSound("tap", soundEnabled);
    try {
      const availablePacks = packs ?? await loadQuestionPacks();
      if (!packs) setPacks(availablePacks);
      const selected = choosePack(availablePacks, difficulty);
      const startedAt = Date.now();
      setGame(createGameState(difficulty, selected.questions, startedAt));
      setNow(startedAt);
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
    const isCorrect = answerCurrent(game, optionId).isCorrect;
    setGame((previous) => {
      if (!previous) return previous;
      const result = answerCurrent(previous, optionId);
      return result.state;
    });
    playSound(isCorrect ? "correct" : "wrong", soundEnabled);
    scheduleNext();
  }, [game, question, scheduleNext, soundEnabled]);

  const passQuestion = useCallback(() => {
    if (!game || !question || !game.acceptingInput) return;
    setGame((previous) => previous ? passCurrent(previous) : previous);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!game || modal || !game.acceptingInput || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (/^[1-4]$/.test(event.key) && question) {
        // Las opciones ya vienen barajadas al crear la partida: el número coincide con el orden en pantalla.
        const option = question.options[Number(event.key) - 1];
        if (option) { event.preventDefault(); answerQuestion(option.id); }
      } else if (event.key.toLowerCase() === "p") { event.preventDefault(); passQuestion(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, game, modal, passQuestion, question]);

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
            creditsButtonRef={creditsButtonRef}
            lastDifficulty={lastDifficulty}
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
            onMenu={() => setModal("abandon")}
            menuButtonRef={menuButtonRef}
          />
        )}
      </main>
      {modal === "credits" && <CreditsModal onClose={() => setModal(null)} />}
      {modal === "exhausted" && <ExhaustedModal onClose={showHome} onReset={resetRotation} />}
      {modal === "results" && game && <ResultsModal game={game} onRestart={() => void startGame(game.difficulty)} onHome={showHome} />}
      {modal === "abandon" && <AbandonModal onClose={() => setModal(null)} onHome={showHome} />}
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
  creditsButtonRef: RefObject<HTMLButtonElement | null>;
  lastDifficulty: Difficulty;
}

function HomeScreen({ loading, error, soundEnabled, onToggleSound, onStart, onOpenCredits, creditsButtonRef, lastDifficulty }: HomeScreenProps) {
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
        {error && <><p className="inline-status inline-status--error" role="alert">{error}</p><button className="secondary-button retry-button" type="button" onClick={() => onStart(lastDifficulty)}>Reintentar</button></>}
      </section>

      <div className="fan-note">
        <span className="fan-note__icon" aria-hidden="true"><img src={baseUrl("assets/spritecollab/pikachu-happy.png")} alt="" /></span>
        <div><strong>Proyecto fan no oficial</strong><p>Pokémon y sus personajes pertenecen a sus respectivos titulares.</p></div>
        <div className="fan-note__actions"><button ref={creditsButtonRef} id="open-credits" className="link-button" type="button" onClick={onOpenCredits}>Fuentes y créditos</button><button className="sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "♫ SONIDO" : "× SILENCIO"}</button></div>
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
  onMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

function GameScreen({ game, question, remaining, timeIsDangerous, soundEnabled, onToggleSound, onAnswer, onPass, onMenu, menuButtonRef }: GameScreenProps) {
  const config = game ? difficultyConfig[game.difficulty] : difficultyConfig.normal;
  const [announcement, setAnnouncement] = useState("");
  const announcedTimes = useRef(new Set<number>());
  useEffect(() => {
    if (!question) return;
    setAnnouncement(`Letra ${question.letter}, ${question.rule === "contains" ? "contiene" : "empieza por"} la letra ${question.letter}: ${question.question}`);
  }, [question]);
  useEffect(() => { announcedTimes.current.clear(); }, [game?.endAt]);
  useEffect(() => {
    const threshold = remaining <= 10_000 ? 10 : remaining <= 30_000 ? 30 : remaining <= 60_000 ? 60 : null;
    if (threshold !== null && !announcedTimes.current.has(threshold)) {
      announcedTimes.current.add(threshold);
      setAnnouncement(threshold === 60 ? "Queda 1 minuto" : `Quedan ${threshold} segundos`);
    }
  }, [remaining]);
  return (
    <section className="screen screen-game" aria-labelledby="game-title">
      <div className="game-toolbar">
        <button ref={menuButtonRef} className="game-menu-button" type="button" onClick={onMenu}>‹ Menú</button>
        <button className="game-sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "♫ SONIDO" : "× SILENCIO"}</button>
      </div>
      <header className="game-header">
        <div className="brand-mini"><div className="brand-orb brand-orb--small" aria-hidden="true"><span>RX</span></div><div><p className="eyebrow">ROSCODEX // <span>{config.label}</span></p><h2 id="game-title">Completa el rosco</h2></div></div>
        <div className={`timer-box${timeIsDangerous ? " is-danger" : ""}`}><span className="timer-box__label">TIEMPO</span><span className="timer-box__value">{formatTime(remaining)}</span></div>
      </header>
      <div className="game-meta"><span>VUELTA {game?.round ?? 1} · LETRA {question?.letter ?? "A"}</span><span><b>{game?.score ?? 0}</b> PUNTOS</span></div>
      <Rosco statuses={game?.statuses ?? emptyStatuses()} questions={game?.questions ?? []} />
      <div className="rosco-legend" aria-label="Leyenda de estados"><Legend status="pending" label="Pendiente" /><Legend status="correct" label="Acierto" /><Legend status="wrong" label="Fallada" /><Legend status="passed" label="Pasada" /><Legend status="expired" label="Tiempo" /></div>
      <QuestionCard game={game} question={question} onAnswer={onAnswer} onPass={onPass} />
      <div className="sr-only" aria-live="polite">{announcement}</div>
    </section>
  );
}

const statusLabels: Record<RoscoStatus, string> = {
  pending: "Pendiente",
  active: "Activa",
  correct: "Acertada",
  wrong: "Fallada",
  passed: "Pasada",
  expired: "Sin tiempo"
};

function Rosco({ statuses, questions }: { statuses: Record<string, RoscoStatus>; questions: Question[] }) {
  const roscoLetters = questions.length ? questions.map((item) => item.letter) : LETTERS;
  return <div className="rosco" aria-label="Estado del rosco">{roscoLetters.map((letter, index) => {
    const angle = (index / roscoLetters.length) * Math.PI * 2 - Math.PI / 2;
    const status = statuses[letter] ?? "pending";
    return <div className={`rosco-letter is-${status}`} key={letter} role="img" aria-label={`${letter}: ${statusLabels[status]}`} style={{ left: `${50 + Math.cos(angle) * 46}%`, top: `${50 + Math.sin(angle) * 46}%` }}><span className="rosco-letter__glyph">{letter}</span></div>;
  })}</div>;
}

function Legend({ status, label }: { status: RoscoStatus; label: string }) {
  return <span><i className={`rosco-legend__dot rosco-legend__dot--${status}`} />{label}</span>;
}

function QuestionCard({ game, question, onAnswer, onPass }: { game: GameState | null; question: Question | null; onAnswer: (optionId: string) => void; onPass: () => void }) {
  const options = question?.options ?? [];
  const correctId = question?.correctOptionId;
  return <section className="panel question-card">
    <div className="question-card__topline"><span className="panel-kicker">DESAFÍO ACTIVO</span><span className="question-rule">{question?.rule === "contains" ? `CONTIENE LA LETRA ${question.letter}` : `EMPIEZA POR LA LETRA ${question?.letter ?? "A"}`}</span></div>
    <h3>{question?.question ?? "Cargando pregunta..."}</h3>
    <div className="answers">{options.map((option, index) => {
      const isCorrect = option.id === correctId;
      const isSelected = option.id === game?.selectedOptionId;
      const resultClass = game?.selectedOptionId ? (isCorrect ? " is-correct" : isSelected ? " is-wrong" : "") : "";
      return (
        <button className={`answer-button${resultClass}`} type="button" key={option.id} disabled={!game?.acceptingInput} onClick={() => onAnswer(option.id)}>
          <span className="answer-number" aria-hidden="true">{index + 1}</span>{option.text}
        </button>
      );
    })}</div>
    <button className="pass-button" type="button" disabled={!game?.acceptingInput} onClick={onPass}>↻ Pasapalabra</button>
    <small className="shortcut-help">Atajos: 1–4 responder · P pasapalabra</small>
    <p className={`feedback ${game?.feedback.kind ?? ""}`} role="status">{game?.feedback.text ?? ""}</p>
  </section>;
}

function ModalShell({ children, onClose, className = "", titleId }: { children: ReactNode; onClose?: () => void; className?: string; titleId: string }) {
  const opener = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const modalRef = useRef<HTMLElement>(null);
  // App se vuelve a pintar cada 250 ms durante la partida: si el efecto dependiera de onClose
  // (una función nueva en cada render) el foco saltaría sin parar. Se guarda en una ref.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const modal = modalRef.current;
    const focusable = () => Array.from(modal?.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onCloseRef.current?.(); return; }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); opener.current?.focus(); };
  }, []);
  return <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><section ref={modalRef} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>{onClose && <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>}{children}</section></div>;
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">INFO // FUENTES</p><h2 id={titleId}>Proyecto fan</h2><p>Roscodex es una demo fan no oficial creada con fines educativos y de experimentación. No está afiliada, patrocinada ni aprobada por Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company.</p><p>Pokémon y los nombres de sus personajes pertenecen a sus respectivos titulares.</p><h3>Fuentes consultadas</h3><ul className="source-list"><li><a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a> — datos estructurados.</li><li><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">PokéAPI Sprites</a> — sprites cacheados.</li><li><a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noopener noreferrer">SpriteCollab</a> — retrato decorativo atribuido a su comunidad bajo CC BY-NC 4.0.</li><li><a href="https://fonts.google.com/specimen/Press+Start+2P" target="_blank" rel="noopener noreferrer">Press Start 2P</a> — tipografía de interfaz.</li><li>Efectos de sonido: tonos 8-bit generados localmente con Web Audio.</li></ul><p className="modal__fine-print">La partida no consulta APIs en tiempo de ejecución. Los recursos necesarios se sirven desde archivos locales.</p></ModalShell>;
}

function ExhaustedModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId}><p className="eyebrow">BANCO COMPLETADO</p><h2 id={titleId}>No quedan preguntas nuevas</h2><p>Has recorrido todas las preguntas disponibles de esta dificultad. La demo no las repetirá automáticamente.</p><button className="primary-button" type="button" onClick={onReset}>Reiniciar rotación</button><button className="secondary-button" type="button" onClick={onClose}>Cambiar dificultad</button></ModalShell>;
}

function ResultsModal({ game, onRestart, onHome }: { game: GameState; onRestart: () => void; onHome: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId}><p className="eyebrow">PARTIDA TERMINADA</p><h2 id={titleId}>{game.finishReason === "time" ? "Tiempo agotado" : "Reto completado"}</h2><div className="result-score"><span>{game.score}</span><small> PUNTOS</small></div><div className="result-grid"><div><strong>{game.correct}</strong><span>Correctas</span></div><div><strong>{game.wrong}</strong><span>Falladas</span></div><div><strong>{game.passed}</strong><span>Pasadas</span></div></div><button className="primary-button" type="button" onClick={onRestart}>Jugar de nuevo</button><button className="secondary-button" type="button" onClick={onHome}>Cambiar dificultad</button></ModalShell>;
}

function AbandonModal({ onClose, onHome }: { onClose: () => void; onHome: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">PARTIDA EN CURSO</p><h2 id={titleId}>¿Abandonar la partida?</h2><button className="primary-button" type="button" onClick={onClose}>Seguir jugando</button><button className="secondary-button" type="button" onClick={onHome}>Abandonar</button></ModalShell>;
}

export default App;
