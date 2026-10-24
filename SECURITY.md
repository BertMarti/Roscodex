# Política de seguridad

Roscodex es una web estática (PWA) sin backend, sin cuentas y sin envío de datos: el único dato que guarda es el historial de preguntas y la preferencia de sonido en el `localStorage` de tu navegador.

## Versiones soportadas

Solo se mantiene la versión publicada en <https://bertmarti.github.io/Roscodex/> (rama `main`).

## Cómo avisar de un problema

- **No abras una incidencia pública** con los detalles de una vulnerabilidad.
- Usa el aviso privado de GitHub: pestaña **Security → Report a vulnerability** del repositorio.
- Indica qué has encontrado, cómo reproducirlo y su posible impacto.

Intentaré responder en un plazo de 7 días. Gracias por ayudar a que el juego sea seguro.

## Medidas actuales

- Content-Security-Policy restrictiva (solo recursos propios, sin scripts en línea) que el plugin `roscodex-csp` de `vite.config.ts` inyecta como `<meta>` en el `index.html` de la build de producción (no en `npm run dev`, que necesita scripts en línea para el HMR).
- CI con [gitleaks](https://github.com/gitleaks/gitleaks), comprobación de tipos, tests y `npm audit` en cada PR.
- Dependabot semanal para dependencias de npm y acciones de GitHub.
