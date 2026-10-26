# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [1.0.0] - 2026-10-26

Primera versión estable. Resume el camino desde la 0.3.0 (septiembre de 2026) hasta hoy; el detalle de cada paso está en las entradas de abajo.

### Qué trae la 1.0
- **El juego completo**: rosco de 26 letras (A–Z) con 2.080 preguntas tipo test sobre Pokémon (520 por dificultad: Principiante, Normal, Difícil y Extremo), Pasapalabra con segunda vuelta y preguntas que no se repiten hasta agotar la dificultad («Reiniciar rotación»).
- **Tres modos**: con reloj, contrarreloj de 2 minutos y práctica sin reloj; partida guiada para la primera visita y ayuda «Cómo se juega».
- **Banco en español oficial**: nombres de Pokémon, movimientos y habilidades como en los juegos, cifras con coma decimal, una sola respuesta válida por pregunta y una explicación breve al fallar.
- **Tu progreso, solo en tu dispositivo**: récords por dificultad (con reloj y contrarreloj), pantalla de estadísticas (aciertos por letra, racha, porcentaje) y compartir el resultado sin datos personales.
- **Para todo el mundo**: teclado completo (1–4, P, Intro, Escape), lectores de pantalla, alto contraste, movimiento reducido y diseño pensado primero para el móvil.
- **App instalable que funciona sin conexión**, con aviso cuando hay una versión nueva (nunca en mitad de una partida).
- **Segura y privada**: sin cuentas, sin anuncios, sin analítica y sin llamadas a APIs durante la partida; Content-Security-Policy estricta, datos guardados con prefijo propio y validados al leer, CI con gitleaks, auditoría de dependencias y tests.

### Añadido
- El número de versión se ve al pie de la portada y en «Fuentes y créditos» (sale de `package.json`; lo comprueba un test).

### Cambiado
- Los textos ya no llaman «demo» al juego (diálogo de créditos y aviso de banco completado).
- Documentación de usuario al día para la 1.0 y hoja de ruta con lo que queda para «después de la 1.0».

### Arreglado
- Al cerrar los resultados con «Jugar de nuevo» o «Cambiar dificultad» el foco ya no se pierde: va al título de la pantalla (con test).

## [0.6.0] — 2026-10-26 (fase 3: lo que se nota al jugar)

### Añadido
- **Estadísticas** en una pantalla propia: partidas, aciertos totales, % de acierto, mejor racha de aciertos seguidos, falladas, pasadas, aciertos por letra (con la letra que más cuesta) y récords por dificultad. Se pueden borrar (con confirmación).
- **Compartir el resultado** con el menú del sistema (Web Share API) o, si no lo hay, copiándolo al portapapeles; si tampoco, se ofrece el texto para copiar a mano. Solo puntos, contadores y una fila 🟩🟥⬜: nada personal.
- **Explicación tras fallar**: la respuesta correcta y una línea de contexto (tipo y generación). Botón «Siguiente ›» e `Intro`; con reloj avanza solo a los 2,6 s, sin reloj espera.
- **Contrarreloj de 2 minutos** en cualquier dificultad, con récords propios.
- **Alto contraste**: se activa solo con `prefers-contrast: more` y se puede forzar o quitar con el interruptor de la portada. Ajustes mínimos para `forced-colors`.

### Cambiado
- **Banco de preguntas con nombres oficiales en español** (PokéAPI, idioma «es»): Pokémon («Colmilargo», «Código Cero», «Mr. Mime» en vez de «Great-Tusk», «Type-Null», «Mr-Mime»; «Basculin» en vez de «Basculin-Red-Striped»), movimientos y habilidades («Nevada» en vez de «Snow Warning»). Alturas y pesos con coma decimal. Los nombres se guardan en `data/pokeapi-nombres-es.json` para no volver a pedirlos.
- El validador del banco rechaza nombres de forma de PokéAPI, decimales con punto y explicaciones vacías o largas.
- **Una sola respuesta válida por pregunta**: los distractores ya no pueden cumplir también la pista (antes 235 preguntas tenían más de una opción válida, 178 en Principiante). La lógica de pistas vive en `scripts/lib/pistas.mjs` y el validador la comprueba en las 2.080 preguntas. IDs y respuestas correctas se conservan.
- «Combina los tipos X» con un solo tipo pasa a «es de tipo X» (103 enunciados).
- Botón principal con más contraste (texto blanco sobre #3f5ed8, 5,5:1; antes 3,9:1) y texto negro en alto contraste (8,6:1).
- El modo elegido se guarda en `roscodex-play-mode-v1` (se migra el antiguo `roscodex-practice-v1`, que se borra).

### Arreglado
- Con «¿Abandonar la partida?» abierto la partida ya no avanza sola a la pregunta siguiente (ni desaparece la explicación); al seguir jugando, el avance pendiente se reprograma con el tiempo que le quedaba.
- Aciertos por letra: solo cuentan las letras acertadas o falladas (no las pendientes ni las que se quedan sin tiempo).

### Notas
- Los IDs de las preguntas se mantienen: quien ya tenía preguntas «vistas» conserva su rotación (algunas de esas preguntas han cambiado de contenido).

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
