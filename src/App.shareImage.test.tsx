// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { dailyNumber } from "./daily";
import { setUpdateStateForTests } from "./pwa";
import { STORAGE_KEYS } from "./storage";
import { bancoDePrueba } from "./test/fixtures";
import { shareImage } from "./shareImage";

vi.mock("./audio", () => ({ playSound: vi.fn() }));
vi.mock("./shareImage", async (importOriginal) => {
  const actual = await importOriginal() as typeof import("./shareImage");
  return {
    ...actual,
    renderShareCard: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
    shareImage: vi.fn(async () => "downloaded" as const)
  };
});

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(bancoDePrueba()), { status: 200 })));
  setUpdateStateForTests({ needRefresh: false, offlineReady: false });
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 31, 10, 0, 0));
  localStorage.setItem(STORAGE_KEYS.onboarding, "done");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("compartir la imagen del rosco del día", () => {
  it("muestra el nombre del archivo cuando la imagen se descarga", async () => {
    localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify({
      lastDate: "2026-10-31",
      streak: 1,
      bestStreak: 1,
      result: {
        date: "2026-10-31",
        number: dailyNumber("2026-10-31"),
        cells: Array.from({ length: 26 }, () => "empty"),
        score: 0,
        correct: 0,
        wrong: 0,
        passed: 0,
        finished: true
      },
      history: []
    }));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Compartir imagen" }));

    expect(await screen.findByText("Imagen descargada: roscodex-rosco-del-dia-1.png")).toBeTruthy();
    expect(vi.mocked(shareImage)).toHaveBeenCalledOnce();
  });
});
