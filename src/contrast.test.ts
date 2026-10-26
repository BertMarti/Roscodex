// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyContrast, isHighContrast, parseContrast, systemPrefersMoreContrast } from "./contrast";

const matchMediaOriginal = window.matchMedia;

function definirMatchMedia(valor: unknown) {
  Object.defineProperty(window, "matchMedia", { value: valor, configurable: true, writable: true });
}

afterEach(() => {
  definirMatchMedia(matchMediaOriginal);
  document.documentElement.removeAttribute("data-contrast");
});

describe("parseContrast", () => {
  it("acepta los tres valores válidos", () => {
    expect(parseContrast("auto")).toBe("auto");
    expect(parseContrast("on")).toBe("on");
    expect(parseContrast("off")).toBe("off");
  });

  it.each([null, "", "ON", "on ", "true", "1", "cualquier cosa"])("convierte la basura %j en auto", (valor) => {
    expect(parseContrast(valor)).toBe("auto");
  });
});

describe("isHighContrast", () => {
  it.each([
    ["on", false, true],
    ["on", true, true],
    ["off", true, false],
    ["off", false, false],
    ["auto", true, true],
    ["auto", false, false]
  ] as const)("preferencia %s con sistema %s da %s", (preferencia, sistema, esperado) => {
    expect(isHighContrast(preferencia, sistema)).toBe(esperado);
  });
});

describe("systemPrefersMoreContrast", () => {
  it("devuelve false si el navegador no tiene matchMedia", () => {
    definirMatchMedia(undefined);
    expect(systemPrefersMoreContrast()).toBe(false);
  });

  it("consulta la preferencia del sistema y devuelve su resultado", () => {
    const matchMedia = vi.fn(() => ({ matches: true } as unknown as MediaQueryList));
    definirMatchMedia(matchMedia);
    expect(systemPrefersMoreContrast()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-contrast: more)");

    definirMatchMedia(vi.fn(() => ({ matches: false } as unknown as MediaQueryList)));
    expect(systemPrefersMoreContrast()).toBe(false);
  });
});

describe("applyContrast", () => {
  it("marca el documento como alto contraste o normal", () => {
    applyContrast(true);
    expect(document.documentElement.dataset.contrast).toBe("high");
    applyContrast(false);
    expect(document.documentElement.dataset.contrast).toBe("normal");
  });
});
