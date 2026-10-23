import { describe, expect, it } from "vitest";
import { emptyStatuses, formatTime, LETTERS } from "./game";

describe("formatTime", () => {
  it("formatea minutos y segundos redondeando hacia arriba", () => {
    expect(formatTime(360_000)).toBe("06:00");
    expect(formatTime(59_001)).toBe("01:00");
    expect(formatTime(1)).toBe("00:01");
  });

  it("nunca muestra tiempo negativo", () => {
    expect(formatTime(-5_000)).toBe("00:00");
  });
});

describe("emptyStatuses", () => {
  it("deja las 26 letras pendientes", () => {
    const statuses = emptyStatuses();
    expect(Object.keys(statuses)).toEqual(LETTERS);
    expect(new Set(Object.values(statuses))).toEqual(new Set(["pending"]));
  });
});
