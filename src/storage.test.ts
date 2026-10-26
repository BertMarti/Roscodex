import { describe, expect, it, vi } from "vitest";
import { parsePlayMode, readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "./storage";
import { crearAlmacenFalso } from "./test/fixtures";

describe("storage", () => {
  it("todas las claves llevan el prefijo roscodex- (origen compartido bertmarti.github.io)", () => {
    for (const clave of Object.values(STORAGE_KEYS)) expect(clave.startsWith("roscodex-")).toBe(true);
  });

  it("lee y escribe en localStorage", () => {
    vi.stubGlobal("localStorage", crearAlmacenFalso());
    writeStorage(STORAGE_KEYS.practice, "on");
    expect(readStorage(STORAGE_KEYS.practice)).toBe("on");
  });

  it("no lanza si el navegador bloquea el almacenamiento", () => {
    const roto = () => { throw new Error("SecurityError"); };
    vi.stubGlobal("localStorage", { getItem: roto, setItem: roto, removeItem: roto });
    expect(readStorage(STORAGE_KEYS.audio)).toBeNull();
    expect(() => writeStorage(STORAGE_KEYS.audio, "off")).not.toThrow();
  });

  it("removeStorage borra la clave y no lanza aunque localStorage falle", () => {
    vi.stubGlobal("localStorage", crearAlmacenFalso());
    writeStorage(STORAGE_KEYS.practice, "on");
    removeStorage(STORAGE_KEYS.practice);
    expect(readStorage(STORAGE_KEYS.practice)).toBeNull();

    const roto = () => { throw new Error("SecurityError"); };
    vi.stubGlobal("localStorage", { getItem: roto, setItem: roto, removeItem: roto });
    expect(() => removeStorage(STORAGE_KEYS.audio)).not.toThrow();
  });
});

describe("parsePlayMode", () => {
  it("prioriza el modo nuevo válido", () => {
    expect(parsePlayMode("timed", "on")).toBe("timed");
    expect(parsePlayMode("blitz", null)).toBe("blitz");
    expect(parsePlayMode("practice", null)).toBe("practice");
  });

  it("migra el antiguo «on» a Práctica si el modo nuevo no es válido", () => {
    expect(parsePlayMode(null, "on")).toBe("practice");
    expect(parsePlayMode("otro", "on")).toBe("practice");
  });

  it("cae en «timed» con valores ausentes o basura", () => {
    expect(parsePlayMode(null, null)).toBe("timed");
    expect(parsePlayMode("", "off")).toBe("timed");
    expect(parsePlayMode("BLITZ", "of")).toBe("timed");
  });
});
