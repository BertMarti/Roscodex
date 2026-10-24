# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [0.5.0] — 2026-10-24 (fase 2: facilidad de uso)

### Añadido
- **Partida guiada** para quien no conoce el juego: la portada la ofrece en la primera visita («¿Primera vez?») y una guía explica, mientras se juega, el rosco, cómo responder (1–4), el Pasapalabra (P) y la segunda vuelta.
- **Cómo se juega**: ayuda siempre a mano en la portada.
- **Modo práctica sin reloj** (se recuerda la elección).
- **Récords locales** por dificultad en las partidas con reloj («¡Nuevo récord!»).
- **Instalar la app**: botón cuando el navegador lo permite (`beforeinstallprompt`) e instrucciones para iPhone/iPad (Compartir → Añadir a pantalla de inicio).
- **Aviso de versión nueva** («Hay una versión nueva de Roscodex» → Recargar / Luego), que nunca interrumpe una partida, y aviso «Listo para jugar sin conexión».
- Tests de componentes con happy-dom y Testing Library, y tests de los módulos nuevos.

### Cambiado
- vite-plugin-pwa 1.3 → 2.0; el service worker pasa de actualizarse solo a avisar (`registerType: "prompt"`). Manifest con `id` y `scope` `/Roscodex/`.
- Acciones de GitHub al día (checkout v7, setup-node v7, upload-pages-artifact v5, deploy-pages v5).
- `package.json` declara `engines.node >= 20.19`; los tests usan como mucho 2 procesos (la Raspberry Pi va justa de memoria).

### Seguridad
- Origen compartido (`bertmarti.github.io`): todas las claves de `localStorage` están en `src/storage.ts` con el prefijo `roscodex-`; la clave antigua `pokereto-question-history-v3` se borra tras migrarla. Nada sensible se guarda.
- Precache sin entradas repetidas (`favicon.svg` y `manifest.webmanifest` salían dos veces).
- Dependabot ignora los saltos mayores de Vitest (Vitest 5 exige Node ≥ 22.12).

## [0.4.0] — 2026-10-24

### Seguridad
- `npm audit` a 0: vite 8.3.5 (2 avisos altos) y `uuid` 11 forzado para `xcode` (3 moderados).
- Content-Security-Policy estricta y `referrer` en la build de producción.
- CI nueva (`ci.yml`): gitleaks, `npm audit --audit-level=high`, tipos, tests, validación del banco, simulación y build.
- `deploy-pages.yml` con permisos de Pages solo en el job que publica (sin `configure-pages`, que exigía permiso de Pages en el job de build); ahora también pasa los tests.
- Dependabot semanal agrupado, `SECURITY.md`, `.gitignore` para `.env*`.

### Añadido
- Atajos de teclado: 1–4 para responder y P para Pasapalabra (con insignias numeradas).
- Botón «‹ Menú» durante la partida con confirmación para abandonar; el reloj se pausa mientras se decide.
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
