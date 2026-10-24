import { describe, expect, it } from "vitest";
import { detectInstallPlatform } from "./pwa";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";
const base = { userAgent: ANDROID, maxTouchPoints: 0, standalone: false, hasPrompt: false };

describe("detectInstallPlatform", () => {
  it("ya instalada (pantalla completa) gana a todo", () => {
    expect(detectInstallPlatform({ ...base, userAgent: IPHONE, standalone: true, hasPrompt: true })).toBe("installed");
  });
  it("con beforeinstallprompt ofrece el botón", () => {
    expect(detectInstallPlatform({ ...base, hasPrompt: true })).toBe("prompt");
  });
  it("iPhone e iPad muestran las instrucciones", () => {
    expect(detectInstallPlatform({ ...base, userAgent: IPHONE, maxTouchPoints: 5 })).toBe("ios");
    expect(detectInstallPlatform({ ...base, userAgent: IPAD, maxTouchPoints: 5 })).toBe("ios");
  });
  it("iPadOS se identifica como Mac pero con pantalla táctil", () => {
    expect(detectInstallPlatform({ ...base, userAgent: MAC, maxTouchPoints: 5 })).toBe("ios");
    expect(detectInstallPlatform({ ...base, userAgent: MAC, maxTouchPoints: 0 })).toBe("unsupported");
  });
  it("sin evento ni iOS no se ofrece nada", () => {
    expect(detectInstallPlatform(base)).toBe("unsupported");
  });
});
