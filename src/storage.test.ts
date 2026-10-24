import { describe, expect, it, vi } from "vitest";
import { readStorage, STORAGE_KEYS, writeStorage } from "./storage";
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
});
