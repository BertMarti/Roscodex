# MEMORY.md — Roscodex

Memoria del proyecto para personas y agentes: decisiones, por qué se tomaron y trampas conocidas. Fecha del último repaso: **24/10/2026**.

## Estado actual (24/10/2026)

- Versión 0.4.0. Publicada en <https://bertmarti.github.io/Roscodex/> con `deploy-pages.yml` (push a `main` + manual).
- `npm audit`: 0 vulnerabilidades. `npm run check` y `npm run build` en verde.
- Banco: 2.080 preguntas válidas (4 × 520). Revisión editorial humana aún pendiente.
- La rama `mejoras-2026-10-24` (PR abierta, sin fusionar) trae seguridad, tests, accesibilidad y docs.

## Decisiones

| Decisión | Por qué |
|---|---|
| PWA estática sin backend | Coste cero, funciona offline, sin datos personales. |
| Lógica de partida pura en `src/gameState.ts` | Testeable con Vitest sin DOM; evita efectos dentro de updaters de React (StrictMode los ejecuta dos veces y el sonido sonaba doble). |
| Vitest 4.1 (no 5) | Vitest 5 exige Node ≥ 22.12 y la Raspberry Pi de desarrollo tiene Node 20.19. La CI usa Node 24. |
| `vitest.config.ts` separado | Evita cargar el plugin PWA (lento) al pasar los tests. Entorno `node`; `localStorage` se simula con `vi.stubGlobal`. |
| CSP inyectada por plugin solo en build | El servidor de Vite usa scripts en línea para HMR; una meta CSP fija en `index.html` rompería `npm run dev`. |
| `overrides` de `uuid` ^11 para `xcode` | `@capacitor/cli` → `xcode` arrastraba `uuid@7` (aviso moderado). `xcode` solo usa `uuid.v4()`, compatible con la 11 (CJS). |
| `data/` fuera de `public/` | La caché de PokéAPI (575 KB) y los packs antiguos se publicaban y precacheaban sin usarse. |
| Opciones barajadas al crear la partida (`choosePack`) | El orden en pantalla debe coincidir con los atajos 1–4; antes se barajaban al pintar. |
| Barra superior con «‹ Menú» y sonido | El botón de sonido flotaba encima del temporizador y no había forma de salir de una partida. |
| Docs técnicas en `doc/DESARROLLO.md` (no `docs/`) | El repo ya usaba `doc/` para toda su documentación; no se duplica la carpeta. Imágenes del README en `doc/img/`. |
| Licencia MIT solo para el código | Sprites, retrato de SpriteCollab (CC BY-NC 4.0) y fuente (OFL) mantienen sus licencias; Pokémon es marca de terceros. |

## Trampas conocidas

- **Base `/Roscodex/` con R mayúscula** en `vite.config.ts`. Pages distingue mayúsculas; los builds móviles usan `--base=/`.
- **El npm 9 de Debian** falla con `Cannot read properties of null (reading 'edgesOut')` al instalar paquetes nuevos: usa `npx npm@11 install …`.
- **El plugin PWA tarda** (hasta ~70 s en la Pi en el primer build por `closeBundle`). No lances varios builds a la vez.
- **Historial de preguntas** en `localStorage` (`roscodex-question-history-v4`, migra desde `pokereto-question-history-v3`). Si se reutilizan IDs con contenido nuevo, los jugadores las verán como «ya jugadas».
- **`ModalShell`**: `App` se repinta cada 250 ms durante la partida; cualquier efecto que dependa de una función creada en el render (p. ej. `onClose`) se reejecuta y roba el foco. Por eso `onClose` va en una ref.
- **`finish()`** debe poder terminar la partida aunque `acceptingInput` sea `false` (el reloj puede agotarse en los 850 ms entre preguntas).
- **Press Start 2P** sí tiene «Í», pero en mayúsculas pequeñas parece una «í»: no es un fallo de la fuente.
- **Nombres de Pokémon con forma** (p. ej. «Basculin-Red-Striped», «Tornadus-Incarnate») salen tal cual de PokéAPI; pendiente de normalizar en el generador.
- Hay documentación histórica en `doc/` que menciona Flutter o `demo/`: es contexto de diseño, la app actual es React + Vite.

## Quién hizo qué (24/10/2026)

- **Claude (jefe)**: auditoría, seguridad (dependencias, CSP, CI, Dependabot, SECURITY, licencia), Vitest, revisión y correcciones de la entrega de código, capturas, DESARROLLO/AGENTS/CLAUDE/MEMORY/PLAN y `.claude/`.
- **GPT-5.6 Luna** (OpenCode): refactor a `gameState.ts`, accesibilidad, atajos, botón Menú y Reintentar.
- **Gemini 3.7 Flash** (OpenCode): borrador del README de jugadores (Gemini 3 Flash y 3.5 Flash agotaron la cuota gratuita).
- **MiMo (Zen)**: tests de `gameState.ts` y `game.ts`.
