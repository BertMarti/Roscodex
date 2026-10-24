import { useSyncExternalStore } from "react";

export type InstallPlatform = "prompt" | "ios" | "installed" | "unsupported";
interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
let installEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function detectInstallPlatform(env: { userAgent: string; maxTouchPoints: number; standalone: boolean; hasPrompt: boolean }): InstallPlatform {
  if (env.standalone) return "installed";
  if (env.hasPrompt) return "prompt";
  if (/iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1)) return "ios";
  return "unsupported";
}

export function listenForInstallPrompt(target: Window = window): () => void {
  const before = (event: Event) => { event.preventDefault(); installEvent = event as BeforeInstallPromptEvent; notify(); };
  const installedHandler = () => { installEvent = null; installed = true; notify(); };
  target.addEventListener("beforeinstallprompt", before);
  target.addEventListener("appinstalled", installedHandler);
  return () => { target.removeEventListener("beforeinstallprompt", before); target.removeEventListener("appinstalled", installedHandler); };
}

function installSnapshot(): InstallPlatform {
  const standalone = installed || window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return detectInstallPlatform({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone, hasPrompt: installEvent !== null });
}

export function useInstallPrompt(): { platform: InstallPlatform; promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable"> } {
  const platform = useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, installSnapshot, () => "unsupported" as InstallPlatform);
  const promptInstall = async () => {
    if (!installEvent) return "unavailable" as const;
    const event = installEvent; installEvent = null; notify();
    await event.prompt();
    return (await event.userChoice).outcome;
  };
  return { platform, promptInstall };
}

export interface UpdateState { needRefresh: boolean; offlineReady: boolean }
let updateState: UpdateState = { needRefresh: false, offlineReady: false };
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const updateListeners = new Set<() => void>();
const notifyUpdate = () => updateListeners.forEach((listener) => listener());

const setUpdate = (patch: Partial<UpdateState>) => { updateState = { ...updateState, ...patch }; notifyUpdate(); };
const subscribeUpdate = (listener: () => void) => { updateListeners.add(listener); return () => { updateListeners.delete(listener); }; };
const serverUpdateState: UpdateState = { needRefresh: false, offlineReady: false };
// Funciones estables (fuera del hook): App se repinta cada 250 ms y un efecto que dependa de ellas
// no debe reiniciarse en cada render (el aviso «Listo sin conexión» no se cerraría nunca).
const reloadWithUpdate = () => { void updateSW?.(true); };
const dismissRefresh = () => setUpdate({ needRefresh: false });
const dismissOffline = () => setUpdate({ offlineReady: false });

type RegisterSW = (options: { immediate?: boolean; onNeedRefresh?: () => void; onOfflineReady?: () => void; onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void }) => (reload?: boolean) => Promise<void>;

export function connectServiceWorker(register: RegisterSW): void {
  updateSW = register({
    immediate: true,
    onNeedRefresh: () => setUpdate({ needRefresh: true }),
    onOfflineReady: () => setUpdate({ offlineReady: true }),
    // Comprueba si hay versión nueva cada hora (sin conexión update() falla: se ignora).
    onRegisteredSW: (_url, registration) => { if (registration) window.setInterval(() => { registration.update().catch(() => undefined); }, 60 * 60 * 1000); }
  });
}

export function useUpdateState(): UpdateState & { reload: () => void; dismissRefresh: () => void; dismissOffline: () => void } {
  const state = useSyncExternalStore(subscribeUpdate, () => updateState, () => serverUpdateState);
  return { ...state, reload: reloadWithUpdate, dismissRefresh, dismissOffline };
}

export function setUpdateStateForTests(state: Partial<UpdateState>): void { setUpdate(state); }
