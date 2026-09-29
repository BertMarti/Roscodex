# Datos, APIs y modelo de preguntas

## Estrategia recomendada

La partida no debe depender de una API en tiempo real. Las APIs se utilizarán para investigar, importar y actualizar datos; después se guardará una copia revisada dentro de `assets/data`.

Esto evita que una caída, cambio o límite de una API impida jugar.

## Fuente principal: PokéAPI

PokéAPI ofrece una API REST gratuita, sin autenticación, con datos estructurados de Pokémon. Su documentación indica que el acceso es abierto y recomienda respetar una política de uso razonable: [PokéAPI v2](https://pokeapi.co/docs/v2).

Usos apropiados para Roscodex:

- Nombres.
- Tipos.
- Habilidades.
- Estadísticas.
- Movimientos.
- Regiones.
- Evoluciones.
- Descripciones estructuradas.
- URLs de sprites para preparar una caché local.

No se debe convertir la partida en una secuencia de peticiones online.

## Imágenes

Opciones, de menor a mayor riesgo:

1. Pixel-art original abstracto: opción más segura para un proyecto propio.
2. Siluetas y formas originales que no representen personajes concretos.
3. Sprites de PokéAPI cacheados solo para la demo fan local, con atribución y revisión de derechos.
4. Imágenes oficiales descargadas de webs oficiales: no recomendadas para reutilización.

El repositorio de sprites de PokéAPI contiene sprites y arte, pero PokéAPI no convierte automáticamente esos personajes en recursos libres de derechos. [Repositorio de sprites de PokéAPI](https://github.com/PokeAPI/sprites).

La demo actual cachea localmente 25 sprites pequeños de la ruta de sprites de PokéAPI para construir el fondo pixelado. La aplicación no los solicita durante la partida. La fuente y la fecha de descarga deben mantenerse documentadas si se amplía el conjunto.

## Tipografía

La demo utiliza `Press Start 2P`, una fuente bitmap distribuida bajo SIL Open Font License. Se incluye la fuente y su licencia en `demo/assets/fonts/`. [Repositorio de Google Fonts](https://github.com/google/fonts/tree/main/ofl/pressstart2p).

## Preguntas

No es necesario depender de una API de preguntas. Las preguntas deben escribirse y revisarse localmente usando datos de PokéAPI.

Open Trivia DB ofrece una API JSON gratuita bajo CC BY-SA 4.0, pero está pensada para trivia general y no debe considerarse una fuente Pokémon principal: [Open Trivia DB](https://opentdb.com/api_config.php).

## Modelo JSON recomendado

```json
{
  "id": "pokemon_001",
  "language": "es",
  "letter": "A",
  "rule": "starts_with",
  "question": "Pokémon de tipo agua cuya evolución final es Blastoise.",
  "options": [
    {"id": "a", "text": "Squirtle"},
    {"id": "b", "text": "Charmander"},
    {"id": "c", "text": "Bulbasaur"},
    {"id": "d", "text": "Pikachu"}
  ],
  "correctOptionId": "a",
  "difficulty": "beginner",
  "category": "pokemon",
  "explanation": "Squirtle evoluciona a Wartortle y después a Blastoise.",
  "source": {
    "name": "PokéAPI",
    "url": "https://pokeapi.co/",
    "retrievedAt": "YYYY-MM-DD"
  },
  "enabled": true
}
```

## Reglas de validación

Cada pregunta debe pasar estas comprobaciones:

- Cuatro opciones exactamente.
- Una única opción correcta.
- Ninguna opción repetida.
- La respuesta correcta cumple `starts_with` o `contains`.
- La pregunta no revela directamente la opción.
- La pregunta tiene fuente.
- El texto está revisado en español.
- Los acentos y la Ñ están normalizados.
- No se copian textos largos de fuentes externas.

## Normalización

Para comprobar letras:

- Convertir a minúsculas.
- Recortar espacios.
- Normalizar acentos solo para la comparación.
- Mantener la forma correcta con tildes para mostrarla.
- Tratar `ñ` como letra distinta de `n` si se incorpora el alfabeto español.

## Distribución

Para 26 letras, cada pack de demo puede utilizar:

- 18 preguntas `starts_with`.
- 8 preguntas `contains`.

La demo utiliza el banco compilado `demo/data/question-bank.json`, generado por `scripts/build-question-bank.mjs` a partir de una caché local de PokéAPI. Cada dificultad contiene 520 preguntas —20 por letra— y la partida selecciona una por letra. El historial de `localStorage` evita repetir IDs hasta agotar el banco; entonces se informa al jugador y no se reinicia automáticamente.

No se debe forzar una pregunta imposible solo para cumplir el porcentaje. La calidad y la respuesta inequívoca tienen prioridad.

## Matriz de dificultad vigente

| Dificultad | Datos permitidos | Datos excluidos o reservados |
|---|---|---|
| Principiante | Tipos y generación escrita con ordinales | Peso, altura, número de Pokédex, experiencia, estadísticas, movimientos, habilidades y combinaciones técnicas |
| Normal | Tipos, generación y un dato técnico sencillo | Combinaciones largas de estadísticas o varios datos de combate |
| Difícil | Dos o tres condiciones, estadísticas, experiencia, habilidades o movimientos | — |
| Extremo | Tres condiciones o más y combinaciones de datos de combate | — |

El formato de cada enunciado es estable: comienza por `Empieza por la letra X.` o `Contiene la letra X.`. No se usan etiquetas de nivel que llamen a la pregunta “pista”.
