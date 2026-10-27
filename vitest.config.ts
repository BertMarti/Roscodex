import { defineConfig } from "vitest/config";

// Config propia para los tests: evita cargar el plugin PWA de vite.config.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.mjs"],
    restoreMocks: true,
    unstubGlobals: true
  }
});
