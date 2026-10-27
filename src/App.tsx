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
  type RoscoStatus,
  explanationFor
} from "./game";
import { playSound } from "./audio";
import { answerCurrent, advance, createGameState, finish, isTimed, passCurrent, resumeAfterPause, type GameMode, type GameState } from "./gameState";
import { parsePlayMode, readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "./storage";
import { currentTip, tutorialTips, type TutorialTip } from "./tutorial";
import { loadRecords, registerResult, type DifficultyRecord } from "./records";
import { accuracyPercent, loadStats, recordGame, resetStats, type PlayerStats } from "./stats";
import { buildShareText, shareResult } from "./share";
import { applyContrast, isHighContrast, loadContrast, saveContrast, systemPrefersMoreContrast, type ContrastPreference } from "./contrast";
import { useInstallPrompt, useUpdateState, type InstallPlatform } from "./pwa";
import { APP_VERSION } from "./version";

type Screen = "home" | "game" | "stats";
type Modal = "credits" | "help" | "ios-install" | "exhausted" | "results" | "abandon" | "reset-stats" | null;

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
  const [lastMode, setLastMode] = useState<GameMode>("timed");
  const [soundEnabled, setSoundEnabled] = useState(() => readStorage(STORAGE_KEYS.audio) !== "off");
  const [playMode, setPlayMode] = useState<GameMode>(() => parsePlayMode(readStorage(STORAGE_KEYS.playMode), readStorage(STORAGE_KEYS.practice)));
  const [onboarding, setOnboarding] = useState(() => readStorage(STORAGE_KEYS.onboarding) !== "done");
  const [records, setRecords] = useState(() => loadRecords());
  const [blitzRecords, setBlitzRecords] = useState(() => loadRecords("blitz"));
  const [stats, setStats] = useState<PlayerStats>(() => loadStats());
  const [contrast, setContrast] = useState<ContrastPreference>(() => loadContrast());
  const [systemContrast, setSystemContrast] = useState(() => systemPrefersMoreContrast());
  const contrastActive = isHighContrast(contrast, systemContrast);
  useEffect(() => { applyContrast(contrastActive); }, [contrastActive]);
  useEffect(() => {
    if (contrast !== "auto" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(prefers-contrast: more)");
    const updateContrast = () => setSystemContrast(query.matches);
    query.addEventListener?.("change", updateContrast);
    return () => query.removeEventListener?.("change", updateContrast);
  }, [contrast]);
  const [newRecord, setNewRecord] = useState(false);
  const [acknowledged, setAcknowledged] = useState<ReadonlySet<TutorialTip>>(new Set());
  const { platform, promptInstall } = useInstallPrompt();
  const update = useUpdateState();
  const [now, setNow] = useState(() => Date.now());
  // Momento en que se abrió «¿Abandonar la partida?»: mientras no sea null, el reloj está en pausa.
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const transitionRef = useRef<number | null>(null);
  // Momento en que saltará el avance automático pendiente y, con el menú abierto, cuánto le quedaba.
  const transitionDueRef = useRef<number | null>(null);
  const pausedTransitionRef = useRef<number | null>(null);
  const creditsButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const resultRegistered = useRef(false);

  const question = useMemo(() => {
    if (!game || game.currentIndex === null) return null;
    return game.questions[game.currentIndex] ?? null;
  }, [game]);

  const clearTransition = useCallback(() => {
    if (transitionRef.current !== null) window.clearTimeout(transitionRef.current);
    transitionRef.current = null;
    transitionDueRef.current = null;
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
    if (!game || game.finished || pausedAt !== null) return undefined;
    if (!isTimed(game)) return undefined;
    const interval = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (currentNow >= game.endAt) finishGame("time");
    }, 250);
    return () => window.clearInterval(interval);
  }, [finishGame, game?.endAt, game?.finished, pausedAt]);

  useEffect(() => {
    if (game?.finished) setModal("results");
  }, [game?.finished]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.audio, soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  useEffect(() => {
    if (!game?.finished || resultRegistered.current) return;
    resultRegistered.current = true;
    if (isTimed(game)) {
      const result = registerResult(game.difficulty, game.score, game.correct, game.mode === "blitz" ? "blitz" : "timed");
      setNewRecord(result.isNewRecord);
      if (game.mode === "blitz") setBlitzRecords((previous) => ({ ...previous, [game.difficulty]: result.record }));
      else setRecords((previous) => ({ ...previous, [game.difficulty]: result.record }));
    }
    setStats(recordGame(game));
    if (game.mode === "guided") { writeStorage(STORAGE_KEYS.onboarding, "done"); setOnboarding(false); }
  }, [game]);

  useEffect(() => () => clearTransition(), [clearTransition]);

  const nextQuestion = useCallback(() => {
    setGame((previous) => {
      if (!previous || previous.finished || previous.acceptingInput) return previous;
      return advance(previous);
    });
  }, []);

  const scheduleNext = useCallback((delay: number | null) => {
    if (delay === null) return;
    clearTransition();
    transitionDueRef.current = Date.now() + delay;
    transitionRef.current = window.setTimeout(() => {
      transitionRef.current = null;
      transitionDueRef.current = null;
      nextQuestion();
    }, delay);
  }, [clearTransition, nextQuestion]);

  const startGame = useCallback(async (difficulty: Difficulty, mode: GameMode = playMode) => {
    setLastDifficulty(difficulty);
    setLastMode(mode);
    clearTransition();
    setLoadError("");
    setLoading(true);
    playSound("tap", soundEnabled);
    try {
      const availablePacks = packs ?? await loadQuestionPacks();
      if (!packs) setPacks(availablePacks);
      // La partida guiada no gasta preguntas de la rotación de Principiante.
      const selected = choosePack(availablePacks, difficulty, mode !== "guided");
      const startedAt = Date.now();
      setGame(createGameState(difficulty, selected.questions, startedAt, mode));
      resultRegistered.current = false;
      setNewRecord(false);
      setAcknowledged(new Set());
      setPausedAt(null);
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
  }, [clearTransition, packs, playMode, soundEnabled]);

  const answerQuestion = useCallback((optionId: string) => {
    if (!game || !question || !game.acceptingInput) return;
    const isCorrect = answerCurrent(game, optionId).isCorrect;
    setGame((previous) => {
      if (!previous) return previous;
      const result = answerCurrent(previous, optionId);
      return result.state;
    });
    playSound(isCorrect ? "correct" : "wrong", soundEnabled);
    scheduleNext(isCorrect ? 850 : (game.mode === "timed" || game.mode === "blitz" ? 2600 : null));
  }, [game, question, scheduleNext, soundEnabled]);

  const passQuestion = useCallback(() => {
    if (!game || !question || !game.acceptingInput) return;
    setGame((previous) => previous ? passCurrent(previous) : previous);
    playSound("pass", soundEnabled);
    scheduleNext(850);
  }, [game, question, scheduleNext, soundEnabled]);

  const pauseForMenu = useCallback(() => {
    const pausedNow = Date.now();
    // Con «¿Abandonar?» abierto la partida se congela del todo: tampoco avanza sola (ni se pierde la explicación).
    pausedTransitionRef.current = transitionDueRef.current === null ? null : Math.max(0, transitionDueRef.current - pausedNow);
    clearTransition();
    setPausedAt(pausedNow);
    setModal("abandon");
  }, [clearTransition]);

  const resumeGame = useCallback(() => {
    const resumedAt = Date.now();
    if (pausedAt !== null) setGame((previous) => previous ? resumeAfterPause(previous, resumedAt - pausedAt) : previous);
    setPausedAt(null);
    setNow(resumedAt);
    setModal(null);
    const pendingDelay = pausedTransitionRef.current;
    pausedTransitionRef.current = null;
    if (pendingDelay !== null) scheduleNext(pendingDelay);
  }, [pausedAt, scheduleNext]);

  const showHome = useCallback(() => {
    clearTransition();
    pausedTransitionRef.current = null;
    setPausedAt(null);
    setGame(null);
    setExhaustedDifficulty(null);
    setModal(null);
    setScreen("home");
    if (game?.mode === "guided") { writeStorage(STORAGE_KEYS.onboarding, "done"); setOnboarding(false); }
  }, [clearTransition, game]);

  const resetRotation = useCallback(() => {
    const difficulty = game?.difficulty ?? exhaustedDifficulty;
    if (!difficulty) return;
    const history = loadQuestionHistory();
    history[difficulty] = [];
    saveQuestionHistory(history);
    setModal(null);
    void startGame(difficulty, lastMode);
  }, [exhaustedDifficulty, game, lastMode, startGame]);

  const remaining = game ? Math.max(0, game.endAt - now) : 0;
  const timeIsDangerous = remaining <= 30_000;
  const guidedTip = currentTip(game?.mode === "guided" ? game : null, acknowledged);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!game || modal || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (game.acceptingInput && /^[1-4]$/.test(event.key) && question) {
        // Las opciones ya vienen barajadas al crear la partida: el número coincide con el orden en pantalla.
        const option = question.options[Number(event.key) - 1];
        if (option) { event.preventDefault(); answerQuestion(option.id); }
      } else if (event.key === "Enter" && game.feedback.kind === "is-wrong" && !game.acceptingInput) {
        // Intro = «Siguiente ›», salvo con el foco en un botón o enlace (su propio Intro ya actúa: no avanzar dos veces).
        if (!(event.target instanceof HTMLElement && ["BUTTON", "A"].includes(event.target.tagName))) { event.preventDefault(); nextQuestion(); }
      } else if (game.acceptingInput && event.key.toLowerCase() === "p") { event.preventDefault(); passQuestion(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, game, modal, nextQuestion, passQuestion, question]);

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
            onOpenHelp={() => setModal("help")}
            onStartGuided={() => void startGame("beginner", "guided")}
            onboarding={onboarding}
            onDismissOnboarding={() => { writeStorage(STORAGE_KEYS.onboarding, "done"); setOnboarding(false); }}
            playMode={playMode}
            onPlayModeChange={(value) => { setPlayMode(value); writeStorage(STORAGE_KEYS.playMode, value); removeStorage(STORAGE_KEYS.practice); }}
            records={playMode === "blitz" ? blitzRecords : records}
            installPlatform={platform}
            onInstall={() => void promptInstall()}
            onIosInstall={() => setModal("ios-install")}
            creditsButtonRef={creditsButtonRef}
            onRetry={() => void startGame(lastDifficulty, lastMode)}
            contrastActive={contrastActive}
            onToggleContrast={() => { const next: ContrastPreference = contrastActive ? "off" : "on"; setContrast(next); saveContrast(next); }}
            onOpenStats={() => setScreen("stats")}
          />
        ) : screen === "stats" ? <StatsScreen stats={stats} records={records} blitzRecords={blitzRecords} onHome={() => setScreen("home")} onReset={() => setModal("reset-stats")} /> : (
          <GameScreen
            game={game}
            question={question}
            remaining={remaining}
            timeIsDangerous={timeIsDangerous}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((enabled) => !enabled)}
            onAnswer={answerQuestion}
            onPass={passQuestion}
            onNextQuestion={nextQuestion}
            onMenu={pauseForMenu}
            menuButtonRef={menuButtonRef}
            guidedTip={guidedTip}
            onAcknowledgeTip={(tip) => setAcknowledged((previous) => new Set(previous).add(tip))}
          />
        )}
      </main>
      {modal === "credits" && <CreditsModal onClose={() => setModal(null)} />}
      {modal === "help" && <HelpModal onClose={() => setModal(null)} onStartGuided={() => { setModal(null); void startGame("beginner", "guided"); }} />}
      {modal === "ios-install" && <IosInstallModal onClose={() => setModal(null)} />}
      {modal === "exhausted" && <ExhaustedModal onClose={showHome} onReset={resetRotation} />}
      {modal === "results" && game && <ResultsModal game={game} record={(game.mode === "blitz" ? blitzRecords : records)[game.difficulty]} newRecord={newRecord} onRestart={() => void startGame(game.difficulty, game.mode === "guided" ? "timed" : game.mode)} onHome={showHome} />}
      {modal === "abandon" && <AbandonModal timed={game ? isTimed(game) : true} onClose={resumeGame} onHome={showHome} />}
      {modal === "reset-stats" && <ConfirmResetModal onCancel={() => setModal(null)} onConfirm={() => { resetStats(); setStats(loadStats()); setRecords(loadRecords()); setBlitzRecords(loadRecords("blitz")); setModal(null); }} />}
      <UpdateToast visible={screen === "home" && modal === null} update={update} />
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
  onOpenHelp: () => void;
  onStartGuided: () => void;
  onboarding: boolean;
  onDismissOnboarding: () => void;
  playMode: GameMode;
  onPlayModeChange: (value: GameMode) => void;
  records: Partial<Record<Difficulty, DifficultyRecord>>;
  installPlatform: InstallPlatform;
  onInstall: () => void;
  onIosInstall: () => void;
  creditsButtonRef: RefObject<HTMLButtonElement | null>;
  onRetry: () => void;
  contrastActive: boolean;
  onToggleContrast: () => void;
  onOpenStats: () => void;
}

function HomeScreen({ loading, error, soundEnabled, onToggleSound, onStart, onOpenCredits, onOpenHelp, onStartGuided, onboarding, onDismissOnboarding, playMode, onPlayModeChange, records, installPlatform, onInstall, onIosInstall, creditsButtonRef, onRetry, contrastActive, onToggleContrast, onOpenStats }: HomeScreenProps) {
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

      {onboarding && <section className="panel onboarding-card" aria-labelledby="onboarding-title"><span className="panel-kicker">PRIMERA MISIÓN</span><h2 id="onboarding-title">¿Primera vez?</h2><p>Juega una partida guiada sin reloj: te explicamos el rosco, los atajos y el Pasapalabra sobre la marcha.</p><button className="primary-button" type="button" onClick={onStartGuided}>Jugar partida guiada</button><button className="secondary-button" type="button" onClick={onDismissOnboarding}>Ya sé jugar</button></section>}
      <section className="panel setup-panel" aria-labelledby="setup-title">
        <div className="panel-heading"><div><span className="panel-kicker">ENTRENADOR // 01</span><h2 id="setup-title">Crear partida</h2></div><span className="panel-mark" aria-hidden="true">✦</span></div>
        <div className="panel-rule" />
        <fieldset className="mode-selector"><legend>Modo de juego</legend>{(["timed", "blitz", "practice"] as const).map((mode) => <label className={playMode === mode ? "is-selected" : ""} key={mode}><input type="radio" name="mode" checked={playMode === mode} onChange={() => onPlayModeChange(mode)} />{mode === "timed" ? "Con reloj" : mode === "blitz" ? "Contrarreloj 2:00" : "Práctica (sin reloj)"}</label>)}</fieldset>
        <p className="field-label">Elige tu dificultad</p>
        <div className="difficulty-grid">
          {difficultyOrder.map((difficulty, index) => (
            <button className={`difficulty-card difficulty-card--${["green", "blue", "orange", "red"][index]}`} data-difficulty={difficulty} type="button" key={difficulty} disabled={loading} onClick={() => onStart(difficulty)}>
              <span className="difficulty-card__badge">0{index + 1}</span>
              <strong>{difficultyConfig[difficulty].label}</strong>
              <small>{playMode === "practice" ? "Sin reloj" : playMode === "blitz" ? "2:00 · Contrarreloj" : difficultyConfig[difficulty].description}{records[difficulty] ? ` · Récord ${records[difficulty]?.bestScore}` : ""}</small>
            </button>
          ))}
        </div>
        {loading && <p className="inline-status" role="status">CARGANDO BANCO LOCAL...</p>}
        {error && <><p className="inline-status inline-status--error" role="alert">{error}</p><button className="secondary-button retry-button" type="button" onClick={onRetry}>Reintentar</button></>}
      </section>

      <div className="fan-note">
        <span className="fan-note__icon" aria-hidden="true"><img src={baseUrl("assets/spritecollab/pikachu-happy.png")} alt="" /></span>
        <div><strong>Proyecto fan no oficial</strong><p>Pokémon y sus personajes pertenecen a sus respectivos titulares.</p></div>
        <div className="fan-note__actions"><button ref={creditsButtonRef} id="open-credits" className="link-button" type="button" onClick={onOpenCredits}>Fuentes y créditos</button><button className="link-button" type="button" onClick={onOpenHelp}>Cómo se juega</button><button className="sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "♫ SONIDO" : "× SILENCIO"}</button><button className="sound-toggle" type="button" onClick={onToggleContrast} aria-pressed={contrastActive}>Alto contraste</button></div>
      </div>
      <button className="secondary-button install-button" type="button" onClick={onOpenStats}>▤ Estadísticas</button>
      {installPlatform === "prompt" && <button className="secondary-button install-button" type="button" onClick={onInstall}>⇩ Instalar app</button>}
      {installPlatform === "ios" && <button className="secondary-button install-button" type="button" onClick={onIosInstall}>Instalar en iPhone</button>}
      <p className="home-footer">SIN CUENTAS · SIN PUBLICIDAD · FUNCIONA OFFLINE<br />ROSCODEX v{APP_VERSION}</p>
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
  onNextQuestion: () => void;
  onMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  guidedTip: TutorialTip | null;
  onAcknowledgeTip: (tip: TutorialTip) => void;
}

function GameScreen({ game, question, remaining, timeIsDangerous, soundEnabled, onToggleSound, onAnswer, onPass, onNextQuestion, onMenu, menuButtonRef, guidedTip, onAcknowledgeTip }: GameScreenProps) {
  const config = game ? difficultyConfig[game.difficulty] : difficultyConfig.normal;
  const timed = game ? isTimed(game) : true;
  const [announcement, setAnnouncement] = useState("");
  const announcedTimes = useRef(new Set<number>());
  useEffect(() => {
    if (!question) return;
    setAnnouncement(`Letra ${question.letter}, ${question.rule === "contains" ? "contiene" : "empieza por"} la letra ${question.letter}: ${question.question}`);
  }, [question]);
  useEffect(() => { announcedTimes.current.clear(); }, [game?.endAt]);
  useEffect(() => {
    if (!timed) return;
    const threshold = remaining <= 10_000 ? 10 : remaining <= 30_000 ? 30 : remaining <= 60_000 ? 60 : null;
    if (threshold !== null && !announcedTimes.current.has(threshold)) {
      announcedTimes.current.add(threshold);
      setAnnouncement(threshold === 60 ? "Queda 1 minuto" : `Quedan ${threshold} segundos`);
    }
  }, [remaining, timed]);
  return (
    <section className="screen screen-game" aria-labelledby="game-title">
      <div className="game-toolbar">
        <button ref={menuButtonRef} className="game-menu-button" type="button" onClick={onMenu}>‹ Menú</button>
        <button className="game-sound-toggle" type="button" onClick={onToggleSound} aria-pressed={soundEnabled}>{soundEnabled ? "♫ SONIDO" : "× SILENCIO"}</button>
      </div>
      <header className="game-header">
        <div className="brand-mini"><div className="brand-orb brand-orb--small" aria-hidden="true"><span>RX</span></div><div><p className="eyebrow">ROSCODEX // <span>{config.label} · {game?.mode === "guided" ? "GUIADA" : game?.mode === "practice" ? "PRÁCTICA" : game?.mode === "blitz" ? "CONTRARRELOJ" : "CON RELOJ"}</span></p><h2 id="game-title">Completa el rosco</h2></div></div>
        <div className={`timer-box${timed && timeIsDangerous ? " is-danger" : ""}`}><span className="timer-box__label">{timed ? "TIEMPO" : "MODO"}</span><span className={`timer-box__value${timed ? "" : " timer-box__value--untimed"}`}>{timed ? formatTime(remaining) : "SIN RELOJ"}</span></div>
      </header>
      <div className="game-meta"><span>VUELTA {game?.round ?? 1} · LETRA {question?.letter ?? "A"}</span><span><b>{game?.score ?? 0}</b> PUNTOS</span></div>
      <Rosco statuses={game?.statuses ?? emptyStatuses()} questions={game?.questions ?? []} highlighted={guidedTip === "rosco"} />
      <div className="rosco-legend" aria-label="Leyenda de estados"><Legend status="pending" label="Pendiente" /><Legend status="correct" label="Acierto" /><Legend status="wrong" label="Fallada" /><Legend status="passed" label="Pasada" /><Legend status="expired" label="Tiempo" /></div>
      {guidedTip && <section className="coach-card" aria-live="polite" aria-label="Guía de la partida"><span className="panel-kicker">GUÍA</span><h3>{tutorialTips[guidedTip].title}</h3><p>{tutorialTips[guidedTip].text}</p><button className="secondary-button" type="button" onClick={() => onAcknowledgeTip(guidedTip)}>Entendido</button></section>}
      <QuestionCard game={game} question={question} onAnswer={onAnswer} onPass={onPass} onNext={() => onNextQuestion?.()} highlightAnswer={guidedTip === "answer"} highlightPass={guidedTip === "pass"} />
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

function Rosco({ statuses, questions, highlighted }: { statuses: Record<string, RoscoStatus>; questions: Question[]; highlighted: boolean }) {
  const roscoLetters = questions.length ? questions.map((item) => item.letter) : LETTERS;
  return <div className="rosco" aria-label="Estado del rosco">{roscoLetters.map((letter, index) => {
    const angle = (index / roscoLetters.length) * Math.PI * 2 - Math.PI / 2;
    const status = statuses[letter] ?? "pending";
    return <div className={`rosco-letter is-${status}${highlighted ? " is-coached" : ""}`} key={letter} role="img" aria-label={`${letter}: ${statusLabels[status]}`} style={{ left: `${50 + Math.cos(angle) * 46}%`, top: `${50 + Math.sin(angle) * 46}%` }}><span className="rosco-letter__glyph">{letter}</span></div>;
  })}</div>;
}

function Legend({ status, label }: { status: RoscoStatus; label: string }) {
  return <span><i className={`rosco-legend__dot rosco-legend__dot--${status}`} />{label}</span>;
}

type RecordTable = Partial<Record<Difficulty, DifficultyRecord>>;

function StatsScreen({ stats, records, blitzRecords, onHome, onReset }: { stats: PlayerStats; records: RecordTable; blitzRecords: RecordTable; onHome: () => void; onReset: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Al entrar, el foco va al título: el lector de pantalla anuncia la pantalla nueva.
  useEffect(() => { titleRef.current?.focus(); }, []);
  const accuracy = accuracyPercent(stats.correct, stats.correct + stats.wrong);
  const hardest = LETTERS
    .map((letter) => ({ letter, percent: (stats.byLetter[letter]?.played ?? 0) >= 2 ? accuracyPercent(stats.byLetter[letter].correct, stats.byLetter[letter].played) : null }))
    .filter((entry): entry is { letter: string; percent: number } => entry.percent !== null && entry.percent < 100)
    .sort((a, b) => a.percent - b.percent)[0];
  const cards: [string, string | number][] = [
    ["Partidas", stats.games], ["Aciertos totales", stats.correct], ["% de acierto", accuracy === null ? "—" : `${accuracy} %`],
    ["Mejor racha", `${stats.bestStreak} seguidos`], ["Falladas", stats.wrong], ["Pasadas", stats.passed]
  ];
  return <section className="screen stats-screen" aria-labelledby="stats-title">
    <div className="game-toolbar"><button className="game-menu-button" type="button" onClick={onHome}>‹ Volver</button></div>
    <p className="eyebrow">ENTRENADOR // HISTORIAL</p>
    <h2 id="stats-title" tabIndex={-1} ref={titleRef}>Estadísticas</h2>
    {stats.games === 0 ? <div className="panel empty-stats">
      <p>Aún no has terminado ninguna partida</p>
      <span>Juega un rosco y aquí verás tus aciertos, tu mejor racha y qué letras se te atragantan.</span>
      <button className="primary-button" type="button" onClick={onHome}>Jugar ahora</button>
    </div> : <>
      <div className="stats-cards">{cards.map(([label, value]) => <div className="stats-card" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      <section className="panel stats-panel" aria-labelledby="letters-title">
        <h3 id="letters-title">Aciertos por letra</h3>
        <ul className="letter-stats" aria-label="Aciertos por letra">{LETTERS.map((letter) => {
          const item = stats.byLetter[letter] ?? { played: 0, correct: 0 };
          const percent = accuracyPercent(item.correct, item.played);
          const level = percent === null ? "empty" : percent >= 70 ? "high" : percent >= 40 ? "medium" : "low";
          return <li className={`letter-stat letter-stat--${level}`} key={letter}>
            <b aria-hidden="true">{letter}</b><span aria-hidden="true">{item.correct}/{item.played}</span><small aria-hidden="true">{percent === null ? "—" : `${percent} %`}</small>
            <span className="sr-only">{percent === null ? `${letter}: sin datos` : `${letter}: ${item.correct} aciertos de ${item.played}, ${percent} %`}</span>
          </li>;
        })}</ul>
        {hardest && <p className="stats-hint">Tu letra más difícil: <b>{hardest.letter}</b> ({hardest.percent} %)</p>}
      </section>
      <table className="records-table panel"><caption>Récords por dificultad</caption>
        <thead><tr><th scope="col">Dificultad</th><th scope="col">Con reloj</th><th scope="col">Contrarreloj</th></tr></thead>
        <tbody>{difficultyOrder.map((difficulty) => <tr key={difficulty}><th scope="row">{difficultyConfig[difficulty].label}</th><td>{records[difficulty]?.bestScore ?? "—"}</td><td>{blitzRecords[difficulty]?.bestScore ?? "—"}</td></tr>)}</tbody>
      </table>
      <button className="secondary-button" type="button" onClick={onReset}>Borrar estadísticas</button>
    </>}
  </section>;
}

function ConfirmResetModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) { const titleId = useId(); return <ModalShell titleId={titleId} onClose={onCancel}><p className="eyebrow">ESTADÍSTICAS</p><h2 id={titleId}>¿Borrar estadísticas?</h2><p>Se borran tus estadísticas y récords de este dispositivo. No se puede deshacer.</p><button className="primary-button" type="button" onClick={onConfirm}>Borrar</button><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button></ModalShell>; }

function QuestionCard({ game, question, onAnswer, onPass, onNext, highlightAnswer, highlightPass }: { game: GameState | null; question: Question | null; onAnswer: (optionId: string) => void; onPass: () => void; onNext: () => void; highlightAnswer: boolean; highlightPass: boolean }) {
  const options = question?.options ?? [];
  const correctId = question?.correctOptionId;
  const wrongExplanation = game?.feedback.kind === "is-wrong" && question ? explanationFor(question) : null;
  return <section className="panel question-card">
    <div className="question-card__topline"><span className="panel-kicker">DESAFÍO ACTIVO</span><span className="question-rule">{question?.rule === "contains" ? `CONTIENE LA LETRA ${question.letter}` : `EMPIEZA POR LA LETRA ${question?.letter ?? "A"}`}</span></div>
    <h3>{question?.question ?? "Cargando pregunta..."}</h3>
    <div className={`answers${highlightAnswer ? " is-coached" : ""}`}>{options.map((option, index) => {
      const isCorrect = option.id === correctId;
      const isSelected = option.id === game?.selectedOptionId;
      const resultClass = game?.selectedOptionId ? (isCorrect ? " is-correct" : isSelected ? " is-wrong" : "") : "";
      return (
        <button className={`answer-button${resultClass}`} type="button" key={option.id} disabled={!game?.acceptingInput} onClick={() => onAnswer(option.id)}>
          <span className="answer-number" aria-hidden="true">{index + 1}</span>{option.text}
        </button>
      );
    })}</div>
    <button className={`pass-button${highlightPass ? " is-coached" : ""}`} type="button" disabled={!game?.acceptingInput} onClick={onPass}>↻ Pasapalabra</button>
    <small className="shortcut-help">Atajos: 1–4 responder · P pasapalabra</small>
    <div className={`feedback ${game?.feedback.kind ?? ""}`} role="status"><span>{game?.feedback.text ?? ""}</span>{wrongExplanation && <small>{wrongExplanation}</small>}</div>
    {game?.feedback.kind === "is-wrong" && <button className="next-button" type="button" onClick={onNext}>Siguiente ›</button>}
  </section>;
}

function focusScreenTitle() {
  const title = document.querySelector<HTMLElement>(".screen h1, .screen h2");
  if (!title) return;
  title.tabIndex = -1;
  title.focus();
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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const target = opener.current;
      if (target?.isConnected) target.focus();
      // Si el botón que abrió el diálogo ya no existe o no admite foco (p. ej. tras «Jugar de nuevo» o
      // «Cambiar dificultad»), el foco va al título de la pantalla para que el teclado no empiece de cero.
      requestAnimationFrame(() => { if (!document.activeElement || document.activeElement === document.body) focusScreenTitle(); });
    };
  }, []);
  return <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><section ref={modalRef} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>{onClose && <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>}{children}</section></div>;
}

function CreditsModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">INFO // FUENTES</p><h2 id={titleId}>Proyecto fan</h2><p>Roscodex es un juego fan no oficial, gratuito y sin ánimo de lucro. No está afiliado, patrocinado ni aprobado por Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company.</p><p>Pokémon y los nombres de sus personajes pertenecen a sus respectivos titulares.</p><h3>Fuentes consultadas</h3><ul className="source-list"><li><a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a> — datos estructurados.</li><li><a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">PokéAPI Sprites</a> — sprites cacheados.</li><li><a href="https://github.com/PMDCollab/SpriteCollab" target="_blank" rel="noopener noreferrer">SpriteCollab</a> — retrato decorativo atribuido a su comunidad bajo CC BY-NC 4.0.</li><li><a href="https://fonts.google.com/specimen/Press+Start+2P" target="_blank" rel="noopener noreferrer">Press Start 2P</a> — tipografía de interfaz.</li><li>Efectos de sonido: tonos 8-bit generados localmente con Web Audio.</li></ul><p className="modal__fine-print">La partida no consulta APIs en tiempo de ejecución. Los recursos necesarios se sirven desde archivos locales.</p><p className="modal__fine-print">Roscodex versión {APP_VERSION}.</p></ModalShell>;
}

function ExhaustedModal({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId}><p className="eyebrow">BANCO COMPLETADO</p><h2 id={titleId}>No quedan preguntas nuevas</h2><p>Has recorrido todas las preguntas disponibles de esta dificultad. No se repetirán hasta que reinicies la rotación.</p><button className="primary-button" type="button" onClick={onReset}>Reiniciar rotación</button><button className="secondary-button" type="button" onClick={onClose}>Cambiar dificultad</button></ModalShell>;
}

function ResultsModal({ game, record, newRecord, onRestart, onHome }: { game: GameState; record?: DifficultyRecord; newRecord: boolean; onRestart: () => void; onHome: () => void }) {
  const titleId = useId();
  const practice = game.mode === "practice";
  const guided = game.mode === "guided";
  const [shareMessage, setShareMessage] = useState("");
  const [manualText, setManualText] = useState("");
  const manualRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (manualText) { manualRef.current?.focus(); manualRef.current?.select(); } }, [manualText]);
  const share = async () => {
    const text = buildShareText(game);
    const result = await shareResult(text);
    setShareMessage(result === "shared" ? "¡Compartido!" : result === "copied" ? "Resultado copiado. Pégalo donde quieras." : result === "unavailable" ? "Tu navegador no deja compartir. Copia el texto:" : "");
    if (result === "unavailable") setManualText(text);
  };
  return <ModalShell titleId={titleId}><p className="eyebrow">PARTIDA TERMINADA</p><h2 id={titleId}>{guided ? "¡Ya sabes jugar!" : practice ? "Práctica terminada" : game.finishReason === "time" ? "Tiempo agotado" : "Reto completado"}</h2><div className="result-score"><span>{game.score}</span><small> PUNTOS</small></div>{!practice && !guided && record && <p className="record-message">{newRecord ? "¡Nuevo récord!" : `Récord: ${record.bestScore}`}</p>}{practice && <p>Prueba ahora una partida con reloj.</p>}{game.bestStreak > 1 && <p className="streak-message">Mejor racha: {game.bestStreak} aciertos seguidos</p>}<div className="result-grid"><div><strong>{game.correct}</strong><span>Correctas</span></div><div><strong>{game.wrong}</strong><span>Falladas</span></div><div><strong>{game.passed}</strong><span>Pasadas</span></div></div>{!guided && <><button className="secondary-button" type="button" onClick={() => void share()}>Compartir resultado</button>{shareMessage && <p className="inline-status share-status" role="status">{shareMessage}</p>}{manualText && <><label className="share-fallback-label" htmlFor="share-fallback">Texto para compartir</label><textarea ref={manualRef} className="share-fallback" id="share-fallback" readOnly rows={5} value={manualText} /></>}</>}<button className="primary-button" type="button" onClick={onRestart}>{guided ? "Jugar con reloj" : "Jugar de nuevo"}</button><button className="secondary-button" type="button" onClick={onHome}>Cambiar dificultad</button></ModalShell>;
}

function HelpModal({ onClose, onStartGuided }: { onClose: () => void; onStartGuided: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">MANUAL // ROSCODEX</p><h2 id={titleId}>Cómo se juega</h2><p><strong>El rosco:</strong> 26 letras. La respuesta empieza por la letra o la contiene, según indique la pregunta.</p><p><strong>Responder:</strong> toca una opción o pulsa 1–4. Cada acierto suma 10 puntos.</p><p><strong>Pasapalabra:</strong> usa el botón o P para dejarla para la segunda vuelta.</p><p><strong>El reloj:</strong> cada dificultad tiene un tiempo distinto. La contrarreloj da 2 minutos para todo el rosco. También puedes practicar sin reloj.</p><button className="primary-button" type="button" onClick={onStartGuided}>Jugar partida guiada</button></ModalShell>;
}

function IosInstallModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">INSTALACIÓN // IOS</p><h2 id={titleId}>Instalar en iPhone</h2><ol><li>Abre Roscodex en Safari.</li><li>Toca Compartir (el cuadrado con la flecha hacia arriba).</li><li>Elige «Añadir a pantalla de inicio».</li><li>Toca «Añadir».</li></ol><p>Así se abre a pantalla completa y funciona sin conexión.</p></ModalShell>;
}

// Solo en la portada y sin modales: ni interrumpe una partida ni queda encima de un diálogo con el foco atrapado.
function UpdateToast({ visible, update }: { visible: boolean; update: ReturnType<typeof useUpdateState> }) {
  const visibleRefresh = visible && update.needRefresh;
  const visibleOffline = visible && update.offlineReady;
  const { dismissOffline } = update;
  useEffect(() => { if (!visibleOffline) return undefined; const timer = window.setTimeout(dismissOffline, 6000); return () => window.clearTimeout(timer); }, [visibleOffline, dismissOffline]);
  if (!visibleRefresh && !visibleOffline) return null;
  return <div className="update-toast" role="status" aria-live="polite">{visibleRefresh ? <><span>Hay una versión nueva de Roscodex.</span><button type="button" onClick={update.reload}>Recargar</button><button type="button" onClick={update.dismissRefresh}>Luego</button></> : <><span>Listo para jugar sin conexión.</span><button type="button" onClick={update.dismissOffline}>Cerrar</button></>}</div>;
}

function AbandonModal({ timed, onClose, onHome }: { timed: boolean; onClose: () => void; onHome: () => void }) {
  const titleId = useId();
  return <ModalShell titleId={titleId} onClose={onClose}><p className="eyebrow">PARTIDA EN CURSO</p><h2 id={titleId}>¿Abandonar la partida?</h2><p>{timed ? "El reloj está en pausa mientras decides." : "Si abandonas, se pierde el progreso de esta partida."}</p><button className="primary-button" type="button" onClick={onClose}>Seguir jugando</button><button className="secondary-button" type="button" onClick={onHome}>Abandonar</button></ModalShell>;
}

export default App;
