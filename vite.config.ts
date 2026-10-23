import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// CSP solo en la build: el servidor de desarrollo de Vite inyecta scripts en línea (HMR)
// que una política estricta bloquearía. En producción todo es propio y sin scripts en línea.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join("; ");

function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: "roscodex-csp",
    apply: "build",
    transformIndexHtml() {
      return [
        { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: contentSecurityPolicy }, injectTo: "head-prepend" },
        { tag: "meta", attrs: { name: "referrer", content: "strict-origin-when-cross-origin" }, injectTo: "head-prepend" }
      ];
    }
  };
}

export default defineConfig({
  base: "/Roscodex/",
  plugins: [
    contentSecurityPolicyPlugin(),
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
