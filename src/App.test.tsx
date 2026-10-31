// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { LETTERS } from "./game";
import { listenForInstallPrompt, setUpdateStateForTests } from "./pwa";
import { STORAGE_KEYS } from "./storage";
import { SHARE_URL } from "./share";
import packageJson from "../package.json";
import { bancoDePrueba } from "./test/fixtures";

vi.mock("./audio", () => ({ playSound: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(bancoDePrueba()), { status: 200 })));
  setUpdateStateForTests({ needRefresh: false, offlineReady: false });
});
afterEach(() => cleanup());

const boton = (nombre: string | RegExp) => screen.getByRole("button", { name: nombre });

// Responde la letra A con la tecla 1 y espera a un estado que no caduca (la casilla A acertada o fallada).
// El atajo se engancha en un efecto tras pintar: con la máquina cargada, una sola pulsación puede llegar antes
// y perderse, así que se repite hasta que la A cambia (una vez respondida, el «1» se ignora durante la transición).
async function responderConTecla1() {
  await waitFor(() => {
    if (!screen.queryByRole("img", { name: /^A: (Acertada|Fallada)$/ })) fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByRole("img", { name: /^A: (Acertada|Fallada)$/ })).toBeTruthy();
  }, { timeout: 5000 });
}

describe("primera visita", () => {
  it("ofrece la partida guiada y «Ya sé jugar» la oculta para siempre", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "¿Primera vez?" })).toBeTruthy();
    fireEvent.click(boton("Ya sé jugar"));
    expect(screen.queryByRole("heading", { name: "¿Primera vez?" })).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.onboarding)).toBe("done");
    cleanup();
    render(<App />);
    expect(screen.queryByRole("heading", { name: "¿Primera vez?" })).toBeNull();
  });

  it("«Cómo se juega» abre un diálogo que se cierra con Escape", () => {
    render(<App />);
    fireEvent.click(boton("Cómo se juega"));
    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByRole("heading", { name: "Cómo se juega" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("versión", () => {
  it("la portada y «Fuentes y créditos» muestran la versión de package.json", () => {
    render(<App />);
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(screen.getByText(new RegExp(`ROSCODEX v${packageJson.version.replace(/\./g, "\\.")}`))).toBeTruthy();
    fireEvent.click(boton("Fuentes y créditos"));
    expect(within(screen.getByRole("dialog")).getByText(`Roscodex versión ${packageJson.version}.`)).toBeTruthy();
  });
});

describe("modo práctica", () => {
  it("se recuerda, quita el tiempo de las tarjetas y la partida va sin reloj", async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
    expect(localStorage.getItem(STORAGE_KEYS.playMode)).toBe("practice");
    expect(screen.getAllByText(/Sin reloj/).length).toBeGreaterThanOrEqual(4);
    fireEvent.click(boton(/NORMAL/));
    expect(await screen.findByText("SIN RELOJ")).toBeTruthy();
    expect(screen.getByText(/NORMAL · PRÁCTICA/)).toBeTruthy();
  });
});

describe("partida guiada", () => {
  it("explica el rosco, responder con 1–4 y el Pasapalabra mientras se juega", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar partida guiada"));
    expect(await screen.findByRole("heading", { name: "El rosco" })).toBeTruthy();
    expect(screen.getByText("SIN RELOJ")).toBeTruthy();
    fireEvent.click(boton("Entendido"));
    expect(screen.getByRole("heading", { name: "Responder" })).toBeTruthy();
    await responderConTecla1();
    // Sin reloj, un fallo espera a «Siguiente ›» para dejar leer la explicación.
    const siguiente = screen.queryByRole("button", { name: "Siguiente ›" });
    if (siguiente) fireEvent.click(siguiente);
    expect(await screen.findByRole("heading", { name: "Pasapalabra" })).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/VUELTA 1 · LETRA B/)).toBeTruthy(), { timeout: 3000 });
    fireEvent.keyDown(window, { key: "p" });
    expect(await screen.findByText(/volveremos a esta letra/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Pasapalabra" })).toBeNull());
  });

  it("no gasta preguntas de la rotación de Principiante", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar partida guiada"));
    await screen.findByRole("heading", { name: "El rosco" });
    expect(localStorage.getItem(STORAGE_KEYS.questionHistory)).toBeNull();
  });

  it("al abandonarla se da por vista la bienvenida", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar partida guiada"));
    fireEvent.click(await screen.findByRole("button", { name: "‹ Menú" }));
    expect(screen.getByText("Si abandonas, se pierde el progreso de esta partida.")).toBeTruthy();
    fireEvent.click(boton("Abandonar"));
    expect(localStorage.getItem(STORAGE_KEYS.onboarding)).toBe("done");
    expect(screen.queryByRole("heading", { name: "¿Primera vez?" })).toBeNull();
  });
});

describe("instalar la app", () => {
  it("no muestra nada si el navegador no lo permite", () => {
    render(<App />);
    expect(screen.queryByRole("button", { name: /Instalar/ })).toBeNull();
  });

  it("con beforeinstallprompt aparece «Instalar app» y lanza el diálogo del navegador", async () => {
    const quitar = listenForInstallPrompt(window);
    render(<App />);
    const prompt = vi.fn(async () => undefined);
    const evento = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) });
    act(() => { window.dispatchEvent(evento); });
    expect(evento.defaultPrevented).toBe(true);
    fireEvent.click(boton("⇩ Instalar app"));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole("button", { name: "⇩ Instalar app" })).toBeNull());
    quitar();
  });

  it("en iPhone explica Compartir → Añadir a pantalla de inicio", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1");
    render(<App />);
    fireEvent.click(boton("Instalar en iPhone"));
    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByText(/Compartir/)).toBeTruthy();
    expect(within(dialogo).getByText("Elige «Añadir a pantalla de inicio».")).toBeTruthy();
  });
});

describe("aviso de versión nueva", () => {
  it("se muestra en la portada y «Luego» lo oculta", () => {
    render(<App />);
    act(() => setUpdateStateForTests({ needRefresh: true }));
    expect(screen.getByText("Hay una versión nueva de Roscodex.")).toBeTruthy();
    expect(boton("Recargar")).toBeTruthy();
    fireEvent.click(boton("Luego"));
    expect(screen.queryByText("Hay una versión nueva de Roscodex.")).toBeNull();
  });

  it("no interrumpe una partida en curso", async () => {
    localStorage.setItem(STORAGE_KEYS.onboarding, "done");
    render(<App />);
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Completa el rosco");
    act(() => setUpdateStateForTests({ needRefresh: true }));
    expect(screen.queryByText("Hay una versión nueva de Roscodex.")).toBeNull();
    fireEvent.click(boton("‹ Menú"));
    fireEvent.click(boton("Abandonar"));
    expect(screen.getByText("Hay una versión nueva de Roscodex.")).toBeTruthy();
  });

  it("no se pinta encima de un diálogo abierto y vuelve al cerrarlo", () => {
    render(<App />);
    fireEvent.click(boton("Cómo se juega"));
    act(() => setUpdateStateForTests({ needRefresh: true, offlineReady: true }));
    expect(screen.queryByText("Hay una versión nueva de Roscodex.")).toBeNull();
    expect(screen.queryByText("Listo para jugar sin conexión.")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText("Hay una versión nueva de Roscodex.")).toBeTruthy();
  });

  it("el aviso «sin conexión» tampoco sale durante la partida", async () => {
    localStorage.setItem(STORAGE_KEYS.onboarding, "done");
    render(<App />);
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Completa el rosco");
    act(() => setUpdateStateForTests({ offlineReady: true }));
    expect(screen.queryByText("Listo para jugar sin conexión.")).toBeNull();
  });

  it("«Cerrar» del aviso sin conexión no borra el de versión nueva", () => {
    render(<App />);
    act(() => setUpdateStateForTests({ offlineReady: true, needRefresh: true }));
    expect(screen.getByText("Hay una versión nueva de Roscodex.")).toBeTruthy();
    fireEvent.click(boton("Luego"));
    expect(screen.getByText("Listo para jugar sin conexión.")).toBeTruthy();
  });
});

describe("contrarreloj", () => {
  it("guarda el modo blitz, lo anuncia en las tarjetas y arranca con 02:00", async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Contrarreloj 2:00"));
    expect(localStorage.getItem(STORAGE_KEYS.playMode)).toBe("blitz");
    expect(screen.getAllByText("2:00 · Contrarreloj")).toHaveLength(4);
    fireEvent.click(boton(/NORMAL/));
    expect(await screen.findByText(/NORMAL · CONTRARRELOJ/)).toBeTruthy();
    expect(screen.getByText("02:00")).toBeTruthy();
  });
});

describe("explicación al fallar", () => {
  it("muestra la explicación y no avanza hasta pulsar «Siguiente ›»", async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Pregunta de la A");

    const opciones = screen.getAllByRole("button", { name: /Opción [A-D] de la A/ });
    const incorrecta = opciones.find((opcion) => !opcion.textContent?.includes("Opción A de la A"));
    expect(incorrecta).toBeTruthy();
    fireEvent.click(incorrecta!);

    expect(await screen.findByText("✕ Era Opción A de la A")).toBeTruthy();
    expect(screen.getByText("Explicación de la A")).toBeTruthy();
    expect(boton("Siguiente ›")).toBeTruthy();

    vi.useFakeTimers();
    try {
      act(() => { vi.advanceTimersByTime(2_000); });
      expect(screen.getByText(/VUELTA 1 · LETRA A/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }

    fireEvent.click(boton("Siguiente ›"));
    expect(await screen.findByText(/VUELTA 1 · LETRA B/)).toBeTruthy();
  });
});

describe("estadísticas", () => {
  it("abre la pantalla con el foco en el título, muestra el estado vacío y vuelve", async () => {
    render(<App />);
    fireEvent.click(boton("▤ Estadísticas"));
    const titulo = screen.getByRole("heading", { name: "Estadísticas" });
    await waitFor(() => expect(document.activeElement).toBe(titulo));
    expect(screen.getByText("Aún no has terminado ninguna partida")).toBeTruthy();
    fireEvent.click(boton("‹ Volver"));
    expect(screen.getByRole("heading", { name: "Crear partida" })).toBeTruthy();
  });

  it("con datos muestra las fichas y las 26 casillas, y «Borrar» las elimina", () => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({
      games: 2, correct: 10, wrong: 2, passed: 1, bestStreak: 4,
      byLetter: { A: { played: 2, correct: 2 } }
    }));
    const { container } = render(<App />);
    fireEvent.click(boton("▤ Estadísticas"));
    expect(screen.queryByText("Aún no has terminado ninguna partida")).toBeNull();
    expect(container.querySelectorAll(".stats-card")).toHaveLength(6);
    expect(container.querySelectorAll(".letter-stat")).toHaveLength(26);
    expect(screen.getByText("Partidas")).toBeTruthy();

    fireEvent.click(boton("Borrar estadísticas"));
    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByRole("heading", { name: "¿Borrar estadísticas?" })).toBeTruthy();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Borrar" }));

    expect(screen.getByText("Aún no has terminado ninguna partida")).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.records)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.blitzRecords)).toBeNull();
  });
});

describe("alto contraste", () => {
  it("alterna aria-pressed, el atributo del documento y la preferencia guardada", () => {
    const matchMediaOriginal = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
      configurable: true,
      writable: true
    });
    try {
      render(<App />);
      const alternar = boton("Alto contraste");
      expect(alternar.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(alternar);
      expect(alternar.getAttribute("aria-pressed")).toBe("true");
      expect(document.documentElement.dataset.contrast).toBe("high");
      expect(localStorage.getItem(STORAGE_KEYS.contrast)).toBe("on");
    } finally {
      Object.defineProperty(window, "matchMedia", { value: matchMediaOriginal, configurable: true, writable: true });
    }
  });
});

describe("compartir el resultado", () => {
  it("copia al portapapeles el texto del resultado al terminar una partida de práctica", async () => {
    const navegador = globalThis.navigator;
    const shareOriginal = Object.getOwnPropertyDescriptor(navegador, "share");
    const clipboardOriginal = Object.getOwnPropertyDescriptor(navegador, "clipboard");
    const writeText = vi.fn(async (_texto: string) => undefined);
    Object.defineProperty(navegador, "share", { value: undefined, configurable: true });
    Object.defineProperty(navegador, "clipboard", { value: { writeText }, configurable: true });
    const restaurar = () => {
      if (shareOriginal) Object.defineProperty(navegador, "share", shareOriginal);
      else Reflect.deleteProperty(navegador, "share");
      if (clipboardOriginal) Object.defineProperty(navegador, "clipboard", clipboardOriginal);
      else Reflect.deleteProperty(navegador, "clipboard");
    };
    try {
      render(<App />);
      fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
      fireEvent.click(boton(/NORMAL/));
      await screen.findByText("Pregunta de la A");

      for (const letter of LETTERS) {
        const incorrecta = await screen.findByRole("button", { name: new RegExp(`Opción B de la ${letter}`) });
        fireEvent.click(incorrecta);
        fireEvent.click(await screen.findByRole("button", { name: "Siguiente ›" }));
      }

      const dialogo = await screen.findByRole("dialog");
      expect(within(dialogo).getByRole("heading", { name: "Práctica terminada" })).toBeTruthy();
      fireEvent.click(within(dialogo).getByRole("button", { name: "Compartir resultado" }));
      expect(await screen.findByText(/Resultado copiado/)).toBeTruthy();
      expect(writeText).toHaveBeenCalledOnce();
      const texto = writeText.mock.calls[0][0] as string;
      expect(texto.startsWith("Roscodex · ")).toBe(true);
    } finally {
      restaurar();
    }
  }, 20_000);
});

describe("foco al cerrar los resultados", () => {
  it("«Cambiar dificultad» deja el foco en el título de la portada", async () => {
    render(<App />);
    fireEvent.click(boton("Ya sé jugar"));
    fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Pregunta de la A");
    for (const letter of LETTERS) {
      fireEvent.click(await screen.findByRole("button", { name: new RegExp(`Opción B de la ${letter}`) }));
      fireEvent.click(await screen.findByRole("button", { name: "Siguiente ›" }));
    }
    const dialogo = await screen.findByRole("dialog");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Cambiar dificultad" }));
    await waitFor(() => expect(document.activeElement?.id).toBe("home-title"));
  }, 20_000);

  it("«Jugar de nuevo» deja el foco en el título de la partida nueva", async () => {
    render(<App />);
    fireEvent.click(boton("Ya sé jugar"));
    fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Pregunta de la A");
    for (const letter of LETTERS) {
      fireEvent.click(await screen.findByRole("button", { name: new RegExp(`Opción B de la ${letter}`) }));
      fireEvent.click(await screen.findByRole("button", { name: "Siguiente ›" }));
    }
    const dialogo = await screen.findByRole("dialog");
    // El banco de prueba tiene un solo rosco por dificultad: se olvida la rotación para que haya partida nueva.
    localStorage.removeItem(STORAGE_KEYS.questionHistory);
    fireEvent.click(within(dialogo).getByRole("button", { name: "Jugar de nuevo" }));
    await screen.findByText("Pregunta de la A");
    await waitFor(() => expect(document.activeElement?.closest(".screen-game")?.tagName).toBe("SECTION"));
    expect(document.activeElement?.tagName).toBe("H2");
  }, 20_000);
});

describe("menú durante la transición", () => {
  it("el menú congela el avance automático y al seguir se reprograma con el tiempo pendiente", async () => {
    render(<App />);
    fireEvent.click(boton(/NORMAL/));
    await screen.findByText("Pregunta de la A");
    vi.useFakeTimers();
    try {
      const incorrecta = screen.getAllByRole("button", { name: /Opción [A-D] de la A/ })
        .find((opcion) => !opcion.textContent?.includes("Opción A de la A"));
      fireEvent.click(incorrecta!);
      expect(screen.getByText("Explicación de la A")).toBeTruthy();
      act(() => { vi.advanceTimersByTime(1_000); });
      fireEvent.click(boton("‹ Menú"));
      expect(screen.getByRole("heading", { name: "¿Abandonar la partida?" })).toBeTruthy();
      // Con el menú abierto no avanza aunque pase mucho más que los 2,6 s.
      act(() => { vi.advanceTimersByTime(10_000); });
      expect(screen.getByText(/VUELTA 1 · LETRA A/)).toBeTruthy();
      expect(screen.getByText("Explicación de la A")).toBeTruthy();
      fireEvent.click(boton("Seguir jugando"));
      // Quedaban 1,6 s: a los 1,5 s sigue en la A y a los 1,7 s ya está en la B.
      act(() => { vi.advanceTimersByTime(1_500); });
      expect(screen.getByText(/VUELTA 1 · LETRA A/)).toBeTruthy();
      act(() => { vi.advanceTimersByTime(200); });
      expect(screen.getByText(/VUELTA 1 · LETRA B/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("rosco del día", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 31, 10, 0, 0));
    localStorage.setItem(STORAGE_KEYS.onboarding, "done");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const resultadoVacio = (date: string, number: number) => ({
    date,
    number,
    cells: Array.from({ length: 26 }, () => "empty"),
    score: 0,
    correct: 0,
    wrong: 0,
    passed: 0,
    finished: false
  });

  async function jugarYAbandonar() {
    fireEvent.click(boton("Jugar el rosco del día"));
    await screen.findByText(/NORMAL · ROSCO DEL DÍA/);
    await responderConTecla1();
    fireEvent.click(boton("‹ Menú"));
    fireEvent.click(boton("Abandonar"));
    await screen.findByText("Rosco de hoy sin terminar");
  }

  it("muestra el encabezado, el número y la racha en la portada", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Rosco del día" })).toBeTruthy();
    expect(screen.getByText("ROSCO DEL DÍA // #1")).toBeTruthy();
    expect(screen.getByText(/Racha: 0 días/)).toBeTruthy();
    expect(boton("Jugar el rosco del día")).toBeTruthy();
  });

  it("arranca la partida diaria con 05:00 y guarda la racha sin tocar el historial", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar el rosco del día"));
    expect(await screen.findByText(/NORMAL · ROSCO DEL DÍA/)).toBeTruthy();
    expect(screen.getByText("05:00")).toBeTruthy();
    const daily = JSON.parse(localStorage.getItem(STORAGE_KEYS.daily) ?? "null") as { lastDate: string; streak: number };
    expect(daily.lastDate).toBe("2026-10-31");
    expect(daily.streak).toBe(1);
    expect(localStorage.getItem(STORAGE_KEYS.questionHistory)).toBeNull();
  });

  it("responder y abandonar deja el día jugado y ofrece compartir y cuenta atrás", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar el rosco del día"));
    await screen.findByText(/NORMAL · ROSCO DEL DÍA/);
    await responderConTecla1();
    fireEvent.click(boton("‹ Menú"));
    expect(screen.getByText(/el rosco de hoy cuenta como jugado/)).toBeTruthy();
    fireEvent.click(boton("Abandonar"));
    expect(await screen.findByText("Rosco de hoy sin terminar")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Jugar el rosco del día" })).toBeNull();
    expect(boton("Compartir resultado")).toBeTruthy();
    expect(screen.getByText(/Siguiente rosco en \d\d:\d\d:\d\d/)).toBeTruthy();
    expect(screen.getByText(/sin responder/)).toBeTruthy();
    const daily = JSON.parse(localStorage.getItem(STORAGE_KEYS.daily) ?? "null") as { result: { cells: string[] } };
    expect(["correct", "wrong"]).toContain(daily.result.cells[0]);
    expect(screen.getByText(daily.result.cells[0] === "correct" ? /1 acierto/ : /1 fallo/)).toBeTruthy();
  });

  it("al recargar sigue el día sin terminar y sin botón para jugar", async () => {
    render(<App />);
    await jugarYAbandonar();
    cleanup();
    render(<App />);
    expect(await screen.findByText("Rosco de hoy sin terminar")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Jugar el rosco del día" })).toBeNull();
  });

  it("al día siguiente vuelve a ofrecer el rosco, mantiene la racha y la sube al jugar", async () => {
    localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify({
      lastDate: "2026-10-31", streak: 1, bestStreak: 1, result: resultadoVacio("2026-10-31", 1)
    }));
    vi.setSystemTime(new Date(2026, 10, 1, 9, 0, 0));
    render(<App />);
    expect(screen.getByText("ROSCO DEL DÍA // #2")).toBeTruthy();
    expect(screen.getByText(/Racha: 1 día/)).toBeTruthy();
    expect(boton("Jugar el rosco del día")).toBeTruthy();
    fireEvent.click(boton("Jugar el rosco del día"));
    await screen.findByText(/NORMAL · ROSCO DEL DÍA/);
    fireEvent.click(boton("‹ Menú"));
    fireEvent.click(boton("Abandonar"));
    expect(await screen.findByText("Rosco de hoy sin terminar")).toBeTruthy();
    expect(screen.getByText(/Racha: 2 días/)).toBeTruthy();
  });

  it("pierde la racha tras dos días sin jugar pero conserva la mejor", () => {
    localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify({
      lastDate: "2026-10-31", streak: 1, bestStreak: 1, result: resultadoVacio("2026-10-31", 1)
    }));
    vi.setSystemTime(new Date(2026, 10, 3, 9, 0, 0));
    render(<App />);
    expect(screen.getByText(/Racha: 0 días/)).toBeTruthy();
    expect(screen.getByText(/Mejor: 1/)).toBeTruthy();
  });

  it("comparte desde la portada con textarea cuando no hay Web Share ni portapapeles", async () => {
    localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify({
      lastDate: "2026-10-31",
      streak: 1,
      bestStreak: 1,
      result: {
        ...resultadoVacio("2026-10-31", 1),
        cells: ["correct", ...Array.from({ length: 25 }, () => "empty")],
        score: 10,
        correct: 1
      }
    }));
    const navegador = globalThis.navigator;
    const shareOriginal = Object.getOwnPropertyDescriptor(navegador, "share");
    const clipboardOriginal = Object.getOwnPropertyDescriptor(navegador, "clipboard");
    Object.defineProperty(navegador, "share", { value: undefined, configurable: true });
    Object.defineProperty(navegador, "clipboard", { value: undefined, configurable: true });
    try {
      render(<App />);
      fireEvent.click(boton("Compartir resultado"));
      const textarea = await screen.findByLabelText("Texto para compartir") as HTMLTextAreaElement;
      await waitFor(() => expect(document.activeElement).toBe(textarea));
      // Segunda pulsación con el texto ya visible: vuelve a enfocarlo y seleccionarlo (revisión de Fable).
      textarea.blur();
      fireEvent.click(boton("Compartir resultado"));
      await waitFor(() => expect(document.activeElement).toBe(textarea));
      expect(textarea.selectionEnd - textarea.selectionStart).toBe(textarea.value.length);
      expect(textarea.value).toContain("Rosco del día #1");
      expect(textarea.value).toContain("🔥 Racha: 1 día");
      expect(textarea.value.endsWith(SHARE_URL)).toBe(true);
      expect(textarea.value).not.toContain("Pregunta de la A");
    } finally {
      if (shareOriginal) Object.defineProperty(navegador, "share", shareOriginal);
      else Reflect.deleteProperty(navegador, "share");
      if (clipboardOriginal) Object.defineProperty(navegador, "clipboard", clipboardOriginal);
      else Reflect.deleteProperty(navegador, "clipboard");
    }
  });

  it("abandonar no cuenta como partida terminada en las estadísticas", async () => {
    render(<App />);
    await jugarYAbandonar();
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) ?? '{"games":0}') as { games?: number };
    expect(stats.games ?? 0).toBe(0);
  });

  it("el rosco del día no escribe récords", async () => {
    render(<App />);
    await jugarYAbandonar();
    expect(localStorage.getItem(STORAGE_KEYS.records)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.blitzRecords)).toBeNull();
  });

  // Añadidos por Claude en la revisión: los dos fallos que encontró (cambio de día con la app abierta y «terminado» que pasaba a
  // «abandonado» al volver a la portada) fallan sin el arreglo.
  it("con la portada abierta, a medianoche vuelve a ofrecer el rosco sin recargar", async () => {
    render(<App />);
    await jugarYAbandonar();
    vi.setSystemTime(new Date(2026, 10, 1, 0, 0, 1));
    expect(await screen.findByRole("button", { name: "Jugar el rosco del día" }, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByText("ROSCO DEL DÍA // #2")).toBeTruthy();
    expect(screen.getByText(/Racha: 1 día/)).toBeTruthy();
  });

  it("si otra pestaña empieza el rosco del día, esta deja de ofrecerlo", async () => {
    render(<App />);
    expect(boton("Jugar el rosco del día")).toBeTruthy();
    const resultado = { ...resultadoVacio("2026-10-31", 1) };
    localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify({ lastDate: "2026-10-31", streak: 1, bestStreak: 1, result: resultado }));
    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEYS.daily })); });
    expect(await screen.findByText("Rosco de hoy sin terminar")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Jugar el rosco del día" })).toBeNull();
  });

  it("si el resultado sigue abierto a medianoche, avisa de que ya hay rosco nuevo", async () => {
    vi.setSystemTime(new Date(2026, 9, 31, 23, 50, 0));
    render(<App />);
    fireEvent.click(boton("Jugar el rosco del día"));
    await screen.findByText(/NORMAL · ROSCO DEL DÍA/);
    vi.setSystemTime(new Date(2026, 9, 31, 23, 56, 0));
    const dialogo = await screen.findByRole("dialog", {}, { timeout: 3000 });
    expect(within(dialogo).getAllByText(/Siguiente rosco en/).length).toBeGreaterThan(0);
    vi.setSystemTime(new Date(2026, 10, 1, 0, 0, 5));
    expect(await within(dialogo).findByText(/Ya hay un rosco del día nuevo/, {}, { timeout: 3000 })).toBeTruthy();
    expect(within(dialogo).getByRole("heading", { name: "Rosco del día #1" })).toBeTruthy();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Volver a la portada" }));
    expect(await screen.findByRole("button", { name: "Jugar el rosco del día" })).toBeTruthy();
    expect(screen.getByText("ROSCO DEL DÍA // #2")).toBeTruthy();
  });

  it("al acabarse el tiempo enseña el resultado del día, cuenta en estadísticas y queda «terminado»", async () => {
    render(<App />);
    fireEvent.click(boton("Jugar el rosco del día"));
    await screen.findByText(/NORMAL · ROSCO DEL DÍA/);
    await responderConTecla1();
    vi.setSystemTime(new Date(2026, 9, 31, 10, 6, 0));
    const dialogo = await screen.findByRole("dialog", {}, { timeout: 3000 });
    expect(within(dialogo).getByRole("heading", { name: "Rosco del día #1" })).toBeTruthy();
    expect(within(dialogo).getByText("Tiempo agotado")).toBeTruthy();
    expect(within(dialogo).getByText(/Racha: 1 día/)).toBeTruthy();
    expect(within(dialogo).queryByRole("button", { name: "Jugar de nuevo" })).toBeNull();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Volver a la portada" }));
    expect(await screen.findByText("Rosco de hoy terminado")).toBeTruthy();
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEYS.daily) ?? "null") as { result: { finished: boolean } };
    expect(guardado.result.finished).toBe(true);
    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) ?? "null") as { games: number };
    expect(stats.games).toBe(1);
    expect(localStorage.getItem(STORAGE_KEYS.records)).toBeNull();
  });
});
