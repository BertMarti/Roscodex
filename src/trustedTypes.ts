// Trusted Types (CSP de producción: `require-trusted-types-for 'script'; trusted-types default`).
// La app no escribe HTML ni scripts desde cadenas. El único sumidero que se usa es el registro del service worker:
// workbox-window llama a navigator.serviceWorker.register() con una cadena, y sin política Chromium lo bloquea.
// La política «default» solo admite la URL exacta del service worker propio, en este origen; todo lo demás se rechaza
// (no define createHTML ni createScript, así que cualquier innerHTML o eval con cadena falla).

interface TrustedTypesLike { createPolicy: (name: string, rules: { createScriptURL: (input: string) => string }) => unknown; defaultPolicy?: unknown }

export function allowedScriptUrl(input: string, origin: string, base: string): string {
  const url = new URL(input, origin);
  const expected = new URL(`${base}sw.js`, origin);
  if (url.origin === expected.origin && url.pathname === expected.pathname && !url.search && !url.hash && !url.username && !url.password) return url.href;
  throw new TypeError(`URL de script no permitida: ${url.href}`);
}

export function installTrustedTypesPolicy(win: Window & { trustedTypes?: TrustedTypesLike } = window, base: string = import.meta.env.BASE_URL): boolean {
  const factory = win.trustedTypes;
  if (!factory || factory.defaultPolicy) return false;
  try {
    factory.createPolicy("default", { createScriptURL: (input) => allowedScriptUrl(input, win.location.origin, base) });
    return true;
  } catch { return false; }
}

installTrustedTypesPolicy();
