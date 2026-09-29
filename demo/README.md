# Roscodex — demo visual local

Esta primera demo es una vertical slice visual autocontenida para validar el flujo antes de portar la experiencia a Flutter. **Roscodex** es el nombre de la aplicación.

## Ejecutar

Desde la raíz del repositorio:

```bash
python -m http.server 8080 -d demo
```

Abrir [http://localhost:8080](http://localhost:8080).

También se puede ejecutar con cualquier servidor estático local. La demo carga el banco compilado `data/question-bank.json` y no necesita Internet durante la partida. El banco contiene 520 preguntas por dificultad y el historial se guarda solo en `localStorage` del navegador.

Para reconstruir el banco desde la caché local de PokéAPI:

```bash
node scripts/build-question-bank.mjs
```

La primera ejecución consulta PokéAPI y guarda `data/pokeapi-pokemon-cache.json`; las siguientes ejecuciones reutilizan esa caché.

Validar el pack de preguntas:

```bash
node demo/validate-content.mjs
node scripts/simulate-games.mjs
```

## Incluye

- Pantalla de inicio.
- Aviso de proyecto fan y fuentes en panel desplegable.
- Selección de cuatro dificultades.
- Rosco A-Z.
- Animación de pulso pixel-art.
- Temporizador global.
- Cuatro respuestas.
- Pasapalabra y segunda vuelta.
- Feedback correcto, incorrecto y pasado.
- Pantalla de resultados.
- Fondo de sprites pixelados cacheados localmente.
- Banco de 520 preguntas por dificultad con selección de una pregunta por letra.
- Principiante limitado a tipos y generaciones: no usa pesos, alturas, experiencia, estadísticas, movimientos ni habilidades.
- Normal combina datos sencillos y añade un único dato técnico por pregunta; difícil y extremo reservan las combinaciones numéricas y de habilidades/movimientos.
- Todas las preguntas empiezan por `Empieza por la letra X.` o `Contiene la letra X.`; no se usan etiquetas de “Pista”.
- Rotación persistente sin repetir preguntas hasta agotar el banco local.

## No incluye todavía

- Flutter.
- Backend.
- Login.
- Ranking online.
- Sprites descargados en tiempo de ejecución.
- Preguntas descargadas en tiempo de ejecución.
