# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [0.4.0] — 2026-10-24

### Seguridad
- `npm audit` a 0: vite 8.3.5 (2 avisos altos) y `uuid` 11 forzado para `xcode` (3 moderados).
- Content-Security-Policy estricta y `referrer` en la build de producción.
- CI nueva (`ci.yml`): gitleaks, `npm audit --audit-level=high`, tipos, tests, validación del banco, simulación y build.
- `deploy-pages.yml` con permisos de Pages solo en el job que publica; ahora también pasa los tests.
- Dependabot semanal agrupado, `SECURITY.md`, `.gitignore` para `.env*`.

### Añadido
- Atajos de teclado: 1–4 para responder y P para Pasapalabra (con insignias numeradas).
- Botón «‹ Menú» durante la partida con confirmación para abandonar.
- Botón «Reintentar» si no se puede cargar el banco.
- Anuncios para lectores de pantalla: pregunta nueva y avisos de 60/30/10 segundos.
- Tests con Vitest de la lógica de partida y del historial.
- Licencia MIT para el código, README para jugadores con capturas, `doc/DESARROLLO.md`, `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `PLAN.md`, subagentes y skills de Claude Code.

### Cambiado
- Lógica de partida extraída a `src/gameState.ts` (funciones puras).
- Modales accesibles: título asociado, foco atrapado, Escape y retorno del foco.
- Letras del rosco más grandes y legibles; textos pixel con un mínimo de 8 px.
- Barra superior de partida: el botón de sonido ya no tapa el temporizador.
- Estados del rosco anunciados en español.
- Datos que solo usa el generador (caché de PokéAPI, packs antiguos) movidos a `data/`: la PWA precachea ~600 KB menos.

### Corregido
- El service worker no se instalaba (entrada duplicada en el precache de Workbox), así que la PWA no funcionaba sin conexión.
- El sonido de fin de partida podía sonar dos veces (efecto dentro de un updater de React).
- El temporizador se anunciaba 4 veces por segundo a los lectores de pantalla.
- Un historial corrupto en `localStorage` podía romper la selección de preguntas.

## [0.3.0]
- Modernización a React + TypeScript + Vite con PWA y Capacitor.
