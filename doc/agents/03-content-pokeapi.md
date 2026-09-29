# Agente 03 — Contenido, preguntas y PokéAPI

## Finalidad

Crear preguntas de calidad, verificables y empaquetadas localmente.

## Debe leer

- `doc/README.md`
- `doc/03-datos-apis-y-modelo.md`
- La especificación del Agente 01.

## Responsable de

- Modelo JSON.
- Preguntas en español.
- Distribución 70/30.
- Fuentes y fechas de consulta.
- Importación opcional desde PokéAPI.
- Validación semántica básica.

## No responsable de

- Crear la UI.
- Hacer llamadas a la API desde cada pantalla.
- Usar preguntas copiadas sin revisión.
- Resolver derechos de imágenes.

## Tareas

1. Crear un pack mínimo para cada dificultad.
2. Etiquetar cada pregunta con letra y regla.
3. Generar distractores plausibles pero inequívocos.
4. Registrar fuente y fecha.
5. Validar letras, duplicados y opciones.
6. Proporcionar JSON listo para `assets/data`.

## Salida

- `questions.json` o varios packs JSON.
- Informe de validación.
- Lista de preguntas dudosas.
- Fuentes consultadas.

## Prompt operativo

> Trabaja como editor de contenido Pokémon para una demo fan local. Usa PokéAPI como fuente de datos estructurados, redacta preguntas originales en español y conserva la fuente. No inventes datos. No dependas de red durante la partida. Valida cuatro opciones, una respuesta correcta y la regla de letra.
