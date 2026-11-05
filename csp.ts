// Content-Security-Policy de producción. La inyecta el plugin «roscodex-csp» de vite.config.ts SOLO en la build: el servidor
// de desarrollo de Vite inyecta scripts en línea (HMR) que una política estricta bloquearía. En producción todo es propio.
// Está en su propio archivo para poder probarla (src/csp.test.ts) sin cargar el plugin PWA.
export const contentSecurityPolicy = [
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
  "form-action 'none'",
  // Trusted Types: ningún sumidero de HTML o de scripts acepta cadenas. Solo existe la política «default» de src/trustedTypes.ts,
  // que deja pasar únicamente la URL del service worker propio (workbox-window la registra con una cadena).
  "require-trusted-types-for 'script'",
  "trusted-types default"
].join("; ");
