# Agente 11 — Optimizador de preguntas y respuestas

## Finalidad

Crear un banco de preguntas Pokémon consistente, verificable y equilibrado para el rosco A-Z.

## Contexto que debe leer

1. `doc/README.md`
2. `doc/03-datos-apis-y-modelo.md`
3. `doc/09-auditoria-mejoras-y-contexto.md`
4. `demo/data/question-bank.json`, `demo/data/questions.json` y `demo/data/question-packs.json`
5. `scripts/build-question-bank.mjs`
6. `demo/validate-content.mjs` y `scripts/simulate-games.mjs`

## Reglas obligatorias

- Debe haber al menos 520 preguntas por dificultad: 20 candidatas por cada letra A-Z.
- Cada partida debe seleccionar exactamente 26 preguntas, una por letra, de la dificultad elegida.
- El selector debe reservar los IDs utilizados y no repetirlos mientras queden candidatas sin usar.
- Cuando una dificultad se agota, debe mostrar un estado controlado; nunca reiniciar el historial de forma silenciosa.
- Cada registro debe declarar `letter`, `rule`, `prompt`, `correct`, `options`, `category`, `difficulty`, `explanation` y `source`.
- Debe haber exactamente cuatro opciones únicas por pregunta.
- La respuesta correcta debe cumplir la regla: empezar por la letra en `starts_with` o contenerla en `contains`.
- El enunciado debe comenzar exactamente por `Empieza por la letra X.` o `Contiene la letra X.` según `rule`.
- No se permiten etiquetas `Pista directa`, `Pista combinada`, `Pista avanzada` ni `Pista experta`.
- Principiante solo puede usar tipos y generación expresada sin datos numéricos; quedan fuera peso, altura, Pokédex, experiencia, estadísticas, movimientos y habilidades.
- Normal puede combinar tipos con un dato técnico sencillo; difícil y extremo son los niveles para varias condiciones y datos de combate.
- Las preguntas deben estar intercaladas por letra, evitando agrupar todas las de un tipo.
- En cada banco de 520 preguntas hay 360 `starts_with` y 160 `contains` (69,2 % / 30,8 %). En cada rosco se mantienen 18 y 8 respectivamente.
- Las opciones se pueden barajar en la interfaz, pero el JSON debe conservar una respuesta correcta inequívoca.

## Fuente y revisión

Usar PokéAPI para contrastar datos estructurados y guardar las preguntas localmente. La API no debe ser necesaria durante una partida. Cada pregunta debe quedar marcada con fuente, URL, estado de revisión y, cuando se incorpore, fecha de consulta.

## Entregable

- Regenerar `demo/data/question-bank.json` con `node scripts/build-question-bank.mjs` cuando cambien los datos fuente.
- Mantener `demo/data/questions.json` y `demo/data/question-packs.json` como fallback editorial/manual, no como banco principal.
- Ejecutar `node demo/validate-content.mjs` y `node scripts/simulate-games.mjs` desde la raíz.
- Registrar cambios de contenido, excepciones y preguntas pendientes en `doc/09-auditoria-mejoras-y-contexto.md`.

## Criterio de finalización

El validador termina correctamente, la simulación consume 20 roscos completos por dificultad sin repetir IDs, la distribución está documentada y una revisión manual confirma que enunciado, opciones y explicación son comprensibles en español.
