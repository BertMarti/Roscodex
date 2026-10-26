# PLAN.md — Hoja de ruta de Roscodex

Actualizado el 26/10/2026. Prioridad de arriba abajo dentro de cada bloque.

## Hecho hoy (24/10/2026, v0.4.0)

- [x] `npm audit` a 0 vulnerabilidades (vite 8.3.5; `uuid` 11 forzado para `xcode`).
- [x] Vitest con tests de la lógica de partida (`gameState.ts`) y del banco/historial (`game.ts`).
- [x] CI en cada PR: gitleaks, `npm audit`, tipos, tests, validación del banco, simulación y build.
- [x] Content-Security-Policy estricta en la build, Dependabot semanal y `SECURITY.md`.
- [x] Accesibilidad: atajos 1–4 y P, modales con foco atrapado y Escape, anuncios para lector de pantalla sin spam del reloj, rosco con estados en español, textos de al menos 8 px, letras del rosco legibles.
- [x] UX: botón «‹ Menú» con confirmación (reloj en pausa mientras se decide), «Reintentar» si falla la carga, sonido que ya no tapa el temporizador.
- [x] Datos de generación (caché de PokéAPI, packs antiguos) fuera de la web publicada: ~600 KB menos de precache.
- [x] README para jugadores, guía técnica en `doc/DESARROLLO.md`, AGENTS/CLAUDE/MEMORY/PLAN, subagentes y skills.
- [x] Licencia MIT para el código, con las excepciones de recursos de terceros.

## Hecho en la fase 2 (24/10/2026, v0.5.0)

- [x] Partida guiada para la primera visita y ayuda «Cómo se juega».
- [x] Modo práctica sin reloj.
- [x] Récords locales por dificultad.
- [x] Botón «Instalar app» e instrucciones para iPhone; aviso de versión nueva del service worker.
- [x] Tests de componentes con Testing Library + happy-dom.
- [x] vite-plugin-pwa 2.0, acciones al día, Vitest 5 descartado mientras la Pi tenga Node 20.

## Hecho en la fase 3 (26/10/2026, v0.6.0)

- [x] Nombres oficiales en español de Pokémon, movimientos y habilidades; formas legibles; coma decimal; validador más estricto.
- [x] Pantalla de estadísticas (aciertos totales, partidas, racha, aciertos por letra, récords).
- [x] Compartir el resultado (Web Share API → portapapeles → texto a mano), sin datos personales.
- [x] Explicación breve tras fallar con «Siguiente ›».
- [x] Contrarreloj de 2 minutos con récords propios.
- [x] Tema de alto contraste (`prefers-contrast` + interruptor).

## Hecho en la fase 5 (26/10/2026, v1.0.0)

- [x] Versión 1.0.0 en `package.json`, `package-lock.json`, pie de la portada y «Fuentes y créditos» (con test).
- [x] Repaso de calidad: textos sin «demo» ni nada a medias, documentación de usuario fiel, 0 issues, 0 PRs de Dependabot, 0 alertas, `npm audit` a 0.
- [x] Prueba de la build bajo `/Roscodex/` en Chromium, también sin conexión.
- [x] CHANGELOG con la entrada `[1.0.0]`.

## Depende de Alberto (no bloquea la 1.0)

1. **Revisión editorial humana del banco**: muestreo por dificultad con el subagente `revisor-banco-preguntas` (ver hallazgos en `doc/agents/content-quality.md`). Los nombres ya están normalizados y el validador garantiza una sola respuesta válida; falta leer y decidir.
2. Decidir la puntuación pendiente de `doc/08-decisiones-abiertas.md` (penalización por fallo, bonus por completar, puntos por velocidad, si Pasapalabra resta) y si Pasapalabra debe romper la racha. Hoy: +10 por acierto. El cambio iría en `answerCurrent`/`passCurrent` (`src/gameState.ts`) y sus tests.
3. Derechos del contenido Pokémon y del retrato CC BY-NC antes de cualquier tienda de apps.

## Después de la 1.0 (sin compromiso)

- Compartir el resultado también como imagen (canvas → archivo con Web Share Level 2).
- Explicaciones más ricas (descripción de la Pokédex en español) si se revisan editorialmente.
- Alfabeto A–Ñ completo (requiere preguntas nuevas para la Ñ y revisar el rosco).
- Caché de movimientos completa en el generador (hoy guarda 20 por Pokémon; ver «Distractores» en MEMORY.md).
- APK de Android con Capacitor (revisar antes derechos y políticas de tiendas).
- Traducción al inglés.
- Vitest 5 cuando la Raspberry Pi tenga Node ≥ 22.12 (quitar el `ignore` de `.github/dependabot.yml`).
