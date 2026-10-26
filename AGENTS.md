# AGENTS.md — Roscodex

Guía para agentes de IA (Claude Code, OpenCode, Codex…). Léela antes de tocar nada.

## Qué es

Roscodex es un juego fan, gratuito y no oficial de preguntas tipo rosco (inspirado en «Pasapalabra») con temática Pokémon y estética pixel-art. Es una PWA estática (React 19 + TypeScript + Vite) publicada en <https://bertmarti.github.io/Roscodex/>, sin backend ni cuentas. Capacitor permite empaquetarla para Android/iOS.

## Estructura

| Ruta | Contenido |
|---|---|
| `src/App.tsx` | Interfaz: portada, partida, rosco, pregunta, modales, atajos de teclado |
| `src/gameState.ts` | Transiciones **puras** de la partida (sin React ni efectos) |
| `src/game.ts` | Tipos, dificultades, carga del banco, selección sin repetir, historial en `localStorage` |
| `src/audio.ts` | Sonidos 8-bit con Web Audio |
| `src/storage.ts` | **Todas** las claves de `localStorage` (prefijo `roscodex-`) y lectura/escritura que nunca lanza |
| `src/tutorial.ts` / `src/records.ts` | Partida guiada (`currentTip`) y récords locales (con reloj y contrarreloj) |
| `src/stats.ts` / `src/share.ts` / `src/contrast.ts` | Estadísticas (validadas al leer), texto y envío del resultado (Web Share → portapapeles), tema de alto contraste |
| `src/pwa.ts` | Instalar la app y aviso de versión nueva (el registro del SW está en `main.tsx`) |
| `src/styles.css` | Estética pixel-art; paleta en `:root` |
| `src/*.test.ts(x)` | Tests de Vitest junto al archivo que prueban; los `.tsx` usan happy-dom + Testing Library |
| `public/data/question-bank.json` | Banco publicado (2.080 preguntas) |
| `data/` | Caché de PokéAPI, nombres oficiales en español (`pokeapi-nombres-es.json`) y packs antiguos; **no se publica** |
| `scripts/` | `build-question-bank.mjs`, `validate-content.mjs`, `simulate-games.mjs` |
| `doc/` | Diseño, auditorías, roles (`doc/agents/`) y [doc/DESARROLLO.md](doc/DESARROLLO.md) |
| `.github/workflows/` | `ci.yml` (PRs) y `deploy-pages.yml` (Pages) |

## Comandos exactos

```bash
npm ci                 # instalar
npm run dev            # desarrollo → http://localhost:5173/Roscodex/
npm run check          # tipos + Vitest + validación del banco + simulación (obligatorio antes de entregar)
npm run test:unit      # solo Vitest (máx. 2 procesos; en la Pi: nice -n 19 ionice -c3 y NODE_OPTIONS=--max-old-space-size=1024)
npm test               # check + build (igual que la CI)
npm run build          # dist/ con base /Roscodex/
npm run preview        # → http://localhost:4173/Roscodex/
npm run build:bank     # regenerar el banco desde data/pokeapi-pokemon-cache.json
```

Despliegue: push a `main` → `deploy-pages.yml` publica en GitHub Pages. También se puede lanzar a mano (`workflow_dispatch`).

## Convenciones

- TypeScript `strict`; componentes de función; nada de `any` salvo justificación.
- Lógica nueva de partida → función pura en `gameState.ts` con su test; `App.tsx` solo orquesta (sonido, temporizador, foco, anuncios).
- Nada de efectos secundarios (sonido, `localStorage`, `Date.now`) dentro de los updaters de `setState`.
- Textos de interfaz, comentarios, commits y docs en **español de España**.
- Mantén la estética: fuente Press Start 2P (mínimo 8 px), paleta de `:root`, foco visible amarillo, `prefers-reduced-motion`.
- Accesibilidad: botones reales (`<button>`), `aria-*` coherentes, modales vía `ModalShell` (foco atrapado + Escape), móvil primero (comprueba a 390 px).
- Sin dependencias nuevas sin motivo claro; nada de frameworks de UI.

## Contenido

- `question-bank.json` no se edita a mano: se cambia el generador y se ejecuta `npm run build:bank`.
- Después, siempre `npm run validate:content` y `npm run simulate:games` (2.080 preguntas, 20 por letra, 18 «empieza por» + 8 «contiene» por rosco).
- En Principiante no puede haber datos numéricos ni técnicos (lo comprueba el validador).
- Nombres siempre en español oficial (de `data/pokeapi-nombres-es.json`) y cifras con coma decimal; el validador rechaza nombres de forma de PokéAPI («-Incarnate», «-Male»…) y decimales con punto.

## Seguridad y privacidad

- Nunca secretos, tokens, rutas personales ni IPs reales en el repo (ejemplos: `192.168.1.50`).
- Nada de servicios de pago, analítica ni llamadas a APIs durante la partida.
- Nada de `innerHTML`/`dangerouslySetInnerHTML`. Enlaces externos con `rel="noopener noreferrer"`.
- La CSP de producción está en el plugin `roscodex-csp` de `vite.config.ts`: si añades un recurso externo, ajústala de forma explícita.
- La CI pasa gitleaks y `npm audit --audit-level=high`; no la debilites.

## Qué no tocar

- `base: "/Roscodex/"` en `vite.config.ts` (la R mayúscula importa).
- Licencias y atribuciones de `public/assets/*` y el aviso de proyecto fan de la portada y de los créditos.
- Claves de `localStorage` de `STORAGE_KEYS` salvo migración pensada. Toda clave nueva va ahí y con prefijo `roscodex-` (origen compartido `bertmarti.github.io`). Nada sensible en el navegador.
- El service worker debe seguir limitado a `/Roscodex/` (manifest `scope`/`id`, `base`).

## Más contexto

- [MEMORY.md](MEMORY.md) — decisiones, trampas y estado actual.
- [PLAN.md](PLAN.md) — hoja de ruta.
- [doc/DESARROLLO.md](doc/DESARROLLO.md) — guía técnica completa.
- [doc/README.md](doc/README.md) y [doc/agents/](doc/agents/) — documentación de diseño y roles históricos.
- `.claude/agents/` (probador-ui, revisor-banco-preguntas, revisor-seguridad) y `.claude/skills/` (publicar-en-pages, regenerar-banco-preguntas).
