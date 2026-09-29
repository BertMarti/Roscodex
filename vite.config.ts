import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/Roscodex/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "assets/spritecollab/pikachu-happy.png"],
      manifest: {
        name: "Roscodex",
        short_name: "Roscodex",
        description: "Rosco pixel-art fan de Pokémon.",
        lang: "es",
        theme_color: "#080b17",
        background_color: "#080b17",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ttf,json,webmanifest}"]
      }
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
