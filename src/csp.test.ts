import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "../csp";

const directivas = new Map(contentSecurityPolicy.split(";").map((parte) => parte.trim()).filter(Boolean).map((parte) => { const [nombre, ...valores] = parte.split(/\s+/); return [nombre, valores.join(" ")] as const; }));

describe("Content-Security-Policy de producción", () => {
  it("exige Trusted Types con la única política «default»", () => {
    expect(contentSecurityPolicy).toContain("require-trusted-types-for 'script'; trusted-types default");
    expect(directivas.get("require-trusted-types-for")).toBe("'script'");
    expect(directivas.get("trusted-types")).toBe("default");
  });

  it("es estricta: solo recursos propios, sin unsafe-* ni orígenes externos", () => {
    expect(directivas.get("default-src")).toBe("'self'");
    expect(directivas.get("script-src")).toBe("'self'");
    expect(directivas.get("style-src")).toBe("'self'");
    expect(directivas.get("img-src")).toBe("'self' data:");
    expect(directivas.get("object-src")).toBe("'none'");
    expect(contentSecurityPolicy).not.toMatch(/unsafe-|https?:|\*/);
  });

  it("es la que inyecta el plugin de la build", () => {
    const config = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
    expect(config).toContain('import { contentSecurityPolicy } from "./csp";');
    expect(config).toMatch(/"http-equiv": "Content-Security-Policy", content: contentSecurityPolicy/);
  });
});
