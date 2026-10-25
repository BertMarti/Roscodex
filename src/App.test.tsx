// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { listenForInstallPrompt, setUpdateStateForTests } from "./pwa";
import { STORAGE_KEYS } from "./storage";
import { bancoDePrueba } from "./test/fixtures";

vi.mock("./audio", () => ({ playSound: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(bancoDePrueba()), { status: 200 })));
  setUpdateStateForTests({ needRefresh: false, offlineReady: false });
});
afterEach(() => cleanup());

const boton = (nombre: string | RegExp) => screen.getByRole("button", { name: nombre });

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

describe("modo práctica", () => {
  it("se recuerda, quita el tiempo de las tarjetas y la partida va sin reloj", async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText("Práctica (sin reloj)"));
    expect(localStorage.getItem(STORAGE_KEYS.practice)).toBe("on");
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
    fireEvent.keyDown(window, { key: "1" });
    expect(await screen.findByText(/Correcto|Era /)).toBeTruthy();
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
