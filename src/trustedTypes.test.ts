// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { allowedScriptUrl, installTrustedTypesPolicy } from "./trustedTypes";

const origen = "https://bertmarti.github.io";
const base = "/Roscodex/";
const esperado = "https://bertmarti.github.io/Roscodex/sw.js";

describe("allowedScriptUrl", () => {
  it("acepta la ruta del service worker propio, relativa o absoluta", () => {
    expect(allowedScriptUrl("/Roscodex/sw.js", origen, base)).toBe(esperado);
    expect(allowedScriptUrl(esperado, origen, base)).toBe(esperado);
  });

  it("rechaza otros archivos, orígenes, query, hash y URL de script", () => {
    const prohibidas = [
      "/Roscodex/otro.js",
      "https://otro.example/Roscodex/sw.js",
      "/Roscodex/sw.js?v=1",
      "/Roscodex/sw.js#fragmento",
      "javascript:alert(1)",
      "/Roscodex/sw.js/../x.js",
      "https://usuario:clave@bertmarti.github.io/Roscodex/sw.js",
      "https://usuario@bertmarti.github.io/Roscodex/sw.js"
    ];
    for (const input of prohibidas) {
      expect(() => allowedScriptUrl(input, origen, base)).toThrow(TypeError);
    }
  });
});

describe("installTrustedTypesPolicy", () => {
  it("devuelve false si el navegador no tiene Trusted Types", () => {
    const win = { location: { origin: origen } } as unknown as Parameters<typeof installTrustedTypesPolicy>[0];
    expect(installTrustedTypesPolicy(win, base)).toBe(false);
  });

  it("crea la política default con createScriptURL y sin sumideros de HTML o script", () => {
    const creadas: { nombre: string; reglas: Record<string, unknown> }[] = [];
    const trustedTypes = {
      createPolicy: (nombre: string, reglas: { createScriptURL: (input: string) => string }) => {
        creadas.push({ nombre, reglas: reglas as unknown as Record<string, unknown> });
        return {};
      }
    };
    const win = { location: { origin: origen }, trustedTypes } as unknown as Parameters<typeof installTrustedTypesPolicy>[0];

    expect(installTrustedTypesPolicy(win, base)).toBe(true);
    expect(creadas).toHaveLength(1);
    expect(creadas[0].nombre).toBe("default");
    expect(Object.keys(creadas[0].reglas)).toEqual(["createScriptURL"]);
    expect(creadas[0].reglas.createHTML).toBeUndefined();
    expect(creadas[0].reglas.createScript).toBeUndefined();

    const createScriptURL = creadas[0].reglas.createScriptURL as (input: string) => string;
    expect(createScriptURL("/Roscodex/sw.js")).toBe(esperado);
    expect(() => createScriptURL("/Roscodex/otro.js")).toThrow(TypeError);
  });

  it("no crea otra política si ya existe defaultPolicy", () => {
    let llamadas = 0;
    const trustedTypes = { defaultPolicy: {}, createPolicy: () => { llamadas += 1; return {}; } };
    const win = { location: { origin: origen }, trustedTypes } as unknown as Parameters<typeof installTrustedTypesPolicy>[0];
    expect(installTrustedTypesPolicy(win, base)).toBe(false);
    expect(llamadas).toBe(0);
  });
});
