# PLAN.md — Hoja de ruta de Roscodex

Actualizado el 24/10/2026. Prioridad de arriba abajo dentro de cada bloque.

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

## Siguiente

1. **Revisión editorial humana del banco**: muestreo por dificultad con el subagente `revisor-banco-preguntas` (ver hallazgos en `doc/agents/content-quality.md`).
2. **Normalizar nombres** de movimientos y habilidades al español oficial y formas como «Basculin-Red-Striped» a nombres legibles.
3. **Modo práctica** sin temporizador.
4. **Récords locales y estadísticas** (mejor puntuación por dificultad, aciertos totales) en `localStorage`.
5. **Tests de componentes** con Testing Library + jsdom (portada, modales, atajos).
6. Decidir la puntuación pendiente de `doc/08-decisiones-abiertas.md` (penalización por fallo, bonus por completar).

## Ideas (sin compromiso)

- Tema de alto contraste opcional.
- Compartir el resultado como imagen o texto.
- Alfabeto A–Ñ completo.
- Explicación breve de la respuesta tras fallar.
- APK de Android con Capacitor (revisar antes derechos y políticas de tiendas).
- Traducción al inglés.
