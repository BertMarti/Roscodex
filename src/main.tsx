// Primero: la política de Trusted Types debe existir antes de que nada registre el service worker.
import "./trustedTypes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { connectServiceWorker, listenForInstallPrompt } from "./pwa";
import { applyContrast, isHighContrast, loadContrast, systemPrefersMoreContrast } from "./contrast";

listenForInstallPrompt();
connectServiceWorker(registerSW);
applyContrast(isHighContrast(loadContrast(), systemPrefersMoreContrast()));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
