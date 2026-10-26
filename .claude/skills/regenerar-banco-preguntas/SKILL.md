---
name: regenerar-banco-preguntas
description: Regenerar, ampliar o corregir el banco de preguntas de Roscodex a partir de PokéAPI con scripts/build-question-bank.mjs, validarlo y comprobar que no se repiten preguntas. Úsala al cambiar plantillas de preguntas, traducciones o reparto por letra.
---

# Regenerar el banco de preguntas

Archivos:
- `scripts/build-question-bank.mjs` — generador (plantillas, traducciones, reparto por letra y dificultad).
- `data/pokeapi-pokemon-cache.json` — caché de PokéAPI (no se publica). Si existe, el generador no llama a la API.
- `data/pokeapi-nombres-es.json` — nombres oficiales en español (especies por número, movimientos y habilidades). El generador solo pide a PokéAPI los que falten; si alguno no tiene nombre «es», avisa y usa uno legible.
- `public/data/question-bank.json` — resultado que se publica y que carga la partida.

Pasos:
1. Haz los cambios en el generador (nunca a mano en `question-bank.json`).
2. `npm run build:bank` (usa la caché; bórrala solo si de verdad necesitas datos nuevos de PokéAPI y respeta su uso justo).
3. `npm run validate:content` → 4 packs, 2.080 preguntas únicas, ≥20 por letra, 360 «empieza por» + 160 «contiene» por dificultad.
4. `npm run simulate:games` → 20 roscos por dificultad sin repetir.
5. Revisa el diff con `git diff --stat` y una muestra de preguntas (subagente `revisor-banco-preguntas`).
6. El historial de cada jugador guarda IDs de preguntas (`roscodex-question-history-v4` en `localStorage`). Los IDs que desaparecen se ignoran solos; si reutilizas IDs con contenido distinto, el jugador las tendrá por «vistas». Para empezar de cero a todo el mundo, sube la clave `QUESTION_HISTORY_KEY` de `src/game.ts` y apúntalo en `CHANGELOG.md`.
