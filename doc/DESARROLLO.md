# Roscodex — Guía de desarrollo

Todo lo técnico del proyecto: cómo arrancarlo, cómo está organizado, cómo se publica y qué reglas seguir. El [README](../README.md) está pensado para jugadores; la documentación de diseño histórica está en [doc/README.md](README.md).

## Stack

| Pieza | Uso |
|---|---|
| React 19 + TypeScript (strict) | Interfaz y lógica de partida |
| Vite 8 | Servidor de desarrollo y build estática |
| vite-plugin-pwa (Workbox) | PWA instalable y offline-first (precache de la build) |
| Capacitor 8 | Empaquetado opcional para Android/iOS reutilizando la misma build |
| Vitest 4 | Tests unitarios de la lógica |
| Scripts Node (`scripts/*.mjs`) | Generar, validar y simular el banco de preguntas |

No hay backend, cuentas, analítica ni servicios de pago. La partida no llama a ninguna API: todo lo necesario viaja en la build.

## Requisitos

- Node.js 22 o superior (la CI usa Node 24; Node 20.19 también funciona en local).
- npm 10+ (con el npm 9 de algunas distribuciones `npm install` de paquetes nuevos puede fallar; usa `npx npm@11 install ...`).
- Para móvil: Android Studio y/o Xcode, solo si vas a usar Capacitor.

## Comandos

```bash
npm ci                    # instalar dependencias exactas del lockfile
npm run dev               # servidor de desarrollo → http://localhost:5173/Roscodex/
npm run check             # tipos + tests unitarios + validación del banco + simulación de partidas
npm run test:unit         # solo Vitest (npm run test:watch para modo vigilancia)
npm test                  # check + build de producción (lo mismo que la CI)
npm run build             # build en dist/ con base /Roscodex/
npm run preview           # sirve dist/ → http://localhost:4173/Roscodex/
npm run typecheck         # tsc --noEmit
npm run validate:content  # reglas del banco (letras, reparto, duplicados, fuentes…)
npm run simulate:games    # 20 roscos por dificultad sin repetir preguntas
npm run build:bank        # regenera public/data/question-bank.json desde la caché de PokéAPI
```

Móvil (reconstruyen con `--base=/`, que es lo que necesita Capacitor):

```bash
npm run mobile:add:android   # primera vez
npm run mobile:sync          # build + cap sync
npm run mobile:android       # abre Android Studio (mobile:ios para Xcode)
```

## Estructura

```text
src/
  App.tsx          interfaz: portada, partida, rosco, tarjeta de pregunta y modales
  gameState.ts     transiciones puras de la partida (crear, responder, pasar, avanzar, terminar)
  game.ts          tipos, dificultades, carga del banco, selección sin repetir e historial
  audio.ts         efectos 8-bit generados con Web Audio (sin archivos de audio)
  styles.css       estética pixel-art; la paleta vive en :root
  *.test.ts        tests de Vitest junto al archivo que prueban
public/
  data/question-bank.json   banco que se publica y carga la partida
  assets/                   sprites, retrato de SpriteCollab y licencias
data/              caché de PokéAPI y packs editoriales antiguos (NO se publican)
scripts/           generador, validador y simulador del banco
doc/               documentación de diseño, roles de agentes y esta guía
.github/workflows/ ci.yml (PRs) y deploy-pages.yml (publicación)
```

## Cómo funciona una partida

1. `loadQuestionPacks()` descarga `data/question-bank.json` (relativo a la base).
2. `choosePack()` elige una pregunta por letra que el jugador no haya visto, baraja sus opciones una sola vez y guarda los IDs en `localStorage` (`roscodex-question-history-v4`; se migra desde `pokereto-question-history-v3`). Si alguna letra ya no tiene preguntas nuevas lanza `QuestionBankExhaustedError` y la interfaz ofrece «Reiniciar rotación».
3. `gameState.ts` aplica las acciones sin efectos secundarios; `App.tsx` solo dispara sonidos, temporizadores y anuncios para lectores de pantalla.
4. El temporizador compara con `endAt` cada 250 ms; al llegar a cero, `finish(state, "time")` marca la letra activa como «sin tiempo».

## Banco de preguntas

- 4 dificultades × 520 preguntas = 2.080; 20 candidatas por letra y dificultad.
- Cada rosco: 18 preguntas «Empieza por» y 8 «Contiene» (≈70/30 en 26 letras).
- Cada pregunta tiene `source` (proveedor, endpoint y fecha de revisión).
- Nunca se edita `question-bank.json` a mano: se cambia `scripts/build-question-bank.mjs`, se ejecuta `npm run build:bank` y después `validate:content` y `simulate:games`. Ver la skill `.claude/skills/regenerar-banco-preguntas`.

## Identidad visual

- Fondo oscuro `#080b17` con scanlines CRT y sprites pixelados difuminados.
- Paleta: amarillo `#ffcb05` (activo/foco), verde `#35cf78` (acierto), rojo `#ef5262` (fallo), azul `#5874ff` (pasada), naranja `#e86f00`.
- Tipografía Press Start 2P para títulos y etiquetas (mínimo 8 px) y sans-serif del sistema para textos largos.
- Rosco circular de fichas con aire de Poké Ball; la letra activa late en amarillo.
- Responsive: móvil (≤410 px), tablet y escritorio; respeta `prefers-reduced-motion`.

## Accesibilidad

- Foco visible amarillo en botones y enlaces; atajos 1–4 (responder) y P (Pasapalabra).
- Modales con `aria-modal`, `aria-labelledby`, foco atrapado, Escape y retorno del foco.
- Región `aria-live` oculta que anuncia cada pregunta nueva y los avisos de 60/30/10 s (el reloj visible no se anuncia en cada tic).
- Cada letra del rosco tiene `aria-label` con su estado en español.

## Publicación en GitHub Pages

- `.github/workflows/deploy-pages.yml` se ejecuta en cada push a `main` y a mano (`workflow_dispatch`): `npm ci` → `npm run check` → `npm run build` → sube `dist/` y despliega.
- La base es `/Roscodex/` (con **R** mayúscula) en `vite.config.ts`. GitHub Pages distingue mayúsculas.
- Para probar como en producción: `npm run build && npm run preview` y abre `http://localhost:4173/Roscodex/`.
- La PWA se actualiza sola (`registerType: "autoUpdate"`); tras un despliegue puede hacer falta recargar dos veces.

## CI

`.github/workflows/ci.yml` corre en cada PR y push a `main`:

1. **gitleaks** (binario fijado) sobre todo el historial.
2. `npm ci`, `npm audit --audit-level=high`, `npm run check` y `npm run build`.

Dependabot (`.github/dependabot.yml`) propone cada lunes las actualizaciones de npm y de acciones, agrupadas.

## Seguridad y privacidad

- La build incluye una Content-Security-Policy estricta (`default-src 'self'`, sin scripts en línea) inyectada por el plugin `roscodex-csp` de `vite.config.ts`. Solo se aplica en la build porque el servidor de desarrollo necesita scripts en línea. Si añades un recurso externo, ajusta la política.
- Nada de `innerHTML` ni `dangerouslySetInnerHTML`; los enlaces externos llevan `rel="noopener noreferrer"`.
- Solo se guarda en `localStorage` el historial de preguntas y la preferencia de sonido. Nada sale del navegador.
- `npm audit`: `uuid` se fuerza a 11.x para `xcode` (dependencia de `@capacitor/cli`) mediante `overrides` en `package.json`.
- Política de avisos: [SECURITY.md](../SECURITY.md).

## Licencias

- Código: [MIT](../LICENSE) (BertMarti).
- Sprites de PokéAPI (`public/assets/sprites/LICENCE.txt`), retrato de SpriteCollab bajo CC BY-NC 4.0 (`public/assets/spritecollab/ATTRIBUTION.txt`) y fuente Press Start 2P bajo OFL (`public/assets/fonts/OFL.txt`) mantienen sus propias licencias.
- Pokémon y sus nombres son marcas de sus titulares; Roscodex es un proyecto fan no oficial y sin ánimo de lucro. No quites el aviso de la portada ni los créditos.

## Documentación relacionada

- [AGENTS.md](../AGENTS.md): guía rápida para agentes de IA.
- [MEMORY.md](../MEMORY.md): decisiones y trampas conocidas.
- [PLAN.md](../PLAN.md): hoja de ruta.
- [CHANGELOG.md](../CHANGELOG.md): cambios por versión.
- [doc/README.md](README.md): documentación de diseño, auditorías y roles de agentes.
