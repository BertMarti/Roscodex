# MEMORY.md — Roscodex

Memoria del proyecto para personas y agentes: decisiones, por qué se tomaron y trampas conocidas. Fecha del último repaso: **26/10/2026**.

## Estado actual (26/10/2026)

- **Versión 1.0.0** (fase 5, PR desde `v1-2026-10-26`): primera versión estable. Versión visible en la portada y en «Fuentes y créditos» (`src/version.ts` la lee de `package.json`). La release y la etiqueta `v1.0.0` las publica Alberto/el orquestador tras fusionar.
- Versión 0.6.0 (fase 3, PR desde `fase3-2026-10-25`): nombres en español en el banco, estadísticas, compartir, explicación tras fallar, contrarreloj y alto contraste.
- Versión 0.5.0 (fase 2, PR desde `fase2-2026-10-24`): partida guiada, modo práctica, récords, instalar la app y aviso de versión nueva.
- Versión 0.4.0 publicada en <https://bertmarti.github.io/Roscodex/> con `deploy-pages.yml` (push a `main` + manual).
- `npm audit`: 0 vulnerabilidades. `npm run check` y `npm run build` en verde.
- Banco: 2.080 preguntas válidas (4 × 520). Revisión editorial humana aún pendiente.
- La rama `mejoras-2026-10-24` (PR #1) ya está fusionada.

## Decisiones

| Decisión | Por qué |
|---|---|
| PWA estática sin backend | Coste cero, funciona offline, sin datos personales. |
| Lógica de partida pura en `src/gameState.ts` | Testeable con Vitest sin DOM; evita efectos dentro de updaters de React (StrictMode los ejecuta dos veces y el sonido sonaba doble). |
| Vitest 4.1 (no 5) | Vitest 5 exige Node ≥ 22.12 y la Raspberry Pi de desarrollo tiene Node 20.19. La CI usa Node 24. |
| vite-plugin-pwa 2 con `registerType: "prompt"` | Con `autoUpdate` la versión nueva entraba sin avisar y podía recargar en mitad de una partida; ahora se avisa y el jugador decide. El aviso se oculta durante la partida. |
| happy-dom (no jsdom) para tests de componentes | jsdom 30 exige Node ≥ 22.22; happy-dom 21 funciona con Node 20. |
| Claves de `localStorage` centralizadas en `src/storage.ts` | Todas las webs de Pages de BertMarti comparten origen: prefijo `roscodex-` obligatorio (test) y la clave antigua `pokereto-*` se borra tras migrar. |
| Partida guiada = Principiante sin reloj + consejos | Enseña jugando, sin presión; los consejos no son modales y no roban el foco (los atajos siguen funcionando). |
| Estadísticas y contrarreloj en claves nuevas (`roscodex-stats-v1`, `roscodex-blitz-records-v1`, `roscodex-play-mode-v1`, `roscodex-contrast-v1`) validadas al leer | Origen compartido: prefijo obligatorio y nada de confiar en lo guardado (otra web del mismo origen podría escribirlo). |
| Explicación tras fallar = tipo y generación | Es un dato fiable de PokéAPI y no repite los números del enunciado; textos más ricos necesitarían revisión editorial. |
| La racha cuenta aciertos sin fallos de por medio; Pasapalabra no la rompe | Pasar no es responder (igual que en el concurso). La revisión cruzada lo marcó como fallo: es una decisión, cámbiese en `passCurrent` si Alberto prefiere lo contrario. |
| El generador se para si falta un nombre en español | Nada de slugs de PokéAPI en el banco: se añade el nombre oficial a `NAME_OVERRIDES`. |
| La partida guiada no cuenta en estadísticas | Es un tutorial: no debe estropear el porcentaje de acierto. |
| Versión visible importada de `package.json` (`import { version }`) | Una sola fuente de verdad; la importación con nombre de JSON hace que Vite solo meta ese campo en el bundle (comprobado en `dist/`). |
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
- **El panel de navegador de Claude Desktop no deja registrar service workers** («unknown error when fetching the script»): para probar la PWA usa Chromium sin cabeza con CDP (ver `doc/DESARROLLO.md`).
- **`useUpdateState()`** devuelve funciones estables a propósito: `App` se repinta cada 250 ms y un efecto que dependiera de una función nueva reiniciaría el temporizador del aviso sin fin.
- **`finish()`** debe poder terminar la partida aunque `acceptingInput` sea `false` (el reloj puede agotarse en los 850 ms entre preguntas).
- **PWA**: no repitas en `includeAssets` archivos que ya cubre `workbox.globPatterns`; Workbox los duplica con otra revisión y el service worker no se instala (pasó hasta la v0.3.0: la web publicada no funcionaba offline).
- **CSP y `style={{…}}`**: React aplica los estilos por CSSOM (`element.style`), que `style-src 'self'` no bloquea; el rosco posicionado con `left/top` funciona con la CSP (comprobado en Chromium). Un revisor automático lo marcó como fallo: es un falso positivo.
- **Press Start 2P** sí tiene «Í», pero en mayúsculas pequeñas parece una «í»: no es un fallo de la fuente.
- **Nombres del banco**: salen de `data/pokeapi-nombres-es.json` (idioma «es» de PokéAPI; especie por número, movimiento y habilidad por identificador). Las reglas del rosco («empieza por», «contiene») se calculan sobre el nombre en español sin tildes, igual que el validador. Si falta un nombre, el generador avisa y usa uno legible; si dos Pokémon quedan con el mismo nombre, falla.
- **Distractores**: `scripts/lib/pistas.mjs` define las plantillas como funciones y sabe qué hechos usa cada una (tipos, generación, altura, peso, experiencia, habilidad, movimiento, estadística, total). `satisfiesClue` es prudente (tipos: los de la pista están entre los del candidato; empates en la estadística más alta cuentan). Límite conocido: la caché solo guarda los 20 primeros movimientos de cada Pokémon, así que un distractor podría aprender el movimiento citado más allá de esos 20.
- **Estadística más alta empatada**: `highestStat` se queda con la primera del máximo; si hay empate (`highestStatIsTied`), las plantillas dicen «una de sus estadísticas más altas» (campos `tieneStatHigh`/`suStatHigh`). El validador y `scripts/lib/pistas.test.mjs` lo vigilan. `npm run build:bank` es determinista (solo cambia `generatedAt`).
- **Menú en mitad de una transición**: `pauseForMenu` cancela el avance pendiente y guarda lo que le quedaba; `resumeGame` lo reprograma.
- **IDs de pregunta reutilizados** en la v0.6.0: el contenido de ~880 preguntas cambió con los nombres en español, pero se mantuvo `roscodex-question-history-v4` para no reiniciar la rotación de nadie.
- **Tras un fallo** la partida espera (`acceptingInput` false): `nextQuestion` solo avanza si la partida NO acepta respuestas, así el temporizador de 2,6 s y el botón «Siguiente ›» no avanzan dos veces. `Intro` no actúa si el foco está en un botón.
- **Alto contraste**: `main.tsx` pone `data-contrast` en `<html>` antes de pintar (no hay scripts en línea por la CSP). `App` guarda el estado de `prefers-contrast` del sistema para que `aria-pressed` no se quede viejo.
- **Compartir**: `SHARE_URL` es fija (en Capacitor `location` no es la web pública). Chromium sin cabeza en Linux no tiene `navigator.share` ni portapapeles: sale el texto para copiar a mano (es lo esperado).
- Hay documentación histórica en `doc/` que menciona Flutter o `demo/`: es contexto de diseño, la app actual es React + Vite.

## Quién hizo qué (24/10/2026)

- **Claude (jefe)**: auditoría, seguridad (dependencias, CSP, CI, Dependabot, SECURITY, licencia), Vitest, revisión y correcciones de la entrega de código, capturas, DESARROLLO/AGENTS/CLAUDE/MEMORY/PLAN y `.claude/`.
- **GPT-5.6 Luna** (OpenCode): refactor a `gameState.ts`, accesibilidad, atajos, botón Menú y Reintentar.
- **Gemini 3.7 Flash** (OpenCode): borrador del README de jugadores (Gemini 3 Flash y 3.5 Flash agotaron la cuota gratuita).
- **MiMo (Zen)**: tests de `gameState.ts` y `game.ts`.
