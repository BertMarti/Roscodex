# ⚡ PokéReto ⚡

### El desafío pixel-art de las letras

<p align="center">
  <a href="https://bertmarti.github.io/Roscodex/">
    <img src="demo/assets/readme-banner.svg" alt="PokéReto — El desafío de las letras" width="900">
  </a>
</p>

<p align="center">
  <a href="https://bertmarti.github.io/Roscodex/"><strong>▶ Jugar a la demo online</strong></a>
  ·
  <a href="demo/README.md"><strong>Desarrollo local</strong></a>
</p>

> Proyecto fan no oficial, gratuito y sin ánimo de lucro. Pokémon y sus personajes pertenecen a sus respectivos titulares.

## 📖 Contenido

- [¿Qué es PokéReto?](#-qué-es-pokéreto)
- [Cómo jugar](#-cómo-jugar)
- [Dificultades](#-dificultades)
- [Reglas del rosco](#-reglas-del-rosco)
- [Preguntas sin repetición](#-preguntas-sin-repetición)
- [Estética y experiencia](#-estética-y-experiencia)
- [Ejecutar en local](#-ejecutar-en-local)
- [Fuentes y créditos](#-fuentes-y-créditos)
- [Roadmap](#-roadmap)

## 🌍 ¿Qué es PokéReto?

PokéReto es un juego de preguntas tipo rosco inspirado en el formato de televisión “Pasapalabra”, reinterpretado con Pokémon y una interfaz pixel-art retro.

El objetivo es completar las letras de la A a la Z respondiendo preguntas antes de que se termine el tiempo. Cada pregunta tiene cuatro respuestas posibles y una opción de **Pasapalabra** para dejarla para la segunda vuelta.

La aplicación funciona como una demo web estática, sin cuentas, sin publicidad y sin backend obligatorio.

## 🕹️ Cómo jugar

### 1. Elige una dificultad

En la pantalla inicial selecciona uno de los cuatro niveles:

| Nivel | Tiempo | Experiencia |
|---|---:|---|
| 🟢 Principiante | 6:00 | Tipos y generaciones, sin datos técnicos complejos |
| 🔵 Normal | 5:00 | Datos combinados y algún dato técnico sencillo |
| 🟠 Difícil | 4:00 | Varias condiciones, estadísticas, habilidades o movimientos |
| 🔴 Extremo | 3:00 | Combinaciones avanzadas de datos de combate |

### 2. Lee la regla de la letra

La pregunta activa siempre utiliza uno de estos formatos:

- **Empieza por la letra X.** La respuesta comienza por esa letra.
- **Contiene la letra X.** La respuesta contiene esa letra en cualquier posición.

La letra activa se marca en el rosco con una animación de pulso.

### 3. Responde o pasa

Selecciona una de las cuatro respuestas:

- ✅ Correcta: se marca en verde y suma puntos.
- ❌ Incorrecta: se marca en rojo y se revela la respuesta correcta.
- ↻ **Pasapalabra**: deja la pregunta para la segunda vuelta.

Después de cada acción, el juego avanza automáticamente a la siguiente letra.

### 4. Completa la segunda vuelta

Cuando termina la primera vuelta, el juego vuelve a las preguntas que hayas pasado, siempre que todavía quede tiempo.

La partida termina cuando completas el rosco o el temporizador llega a cero. La pantalla final muestra puntuación, aciertos, fallos y preguntas pasadas.

## 🎚️ Dificultades

La dificultad afecta al tipo de información utilizada para construir las preguntas:

- **Principiante:** tipos y generaciones escritas con ordinales. No aparecen peso, altura, número de Pokédex, experiencia, estadísticas, movimientos ni habilidades.
- **Normal:** combina tipos y generación con un dato técnico sencillo.
- **Difícil:** utiliza dos o tres condiciones, estadísticas, experiencia, habilidades o movimientos.
- **Extremo:** combina tres o más datos técnicos y de combate.

## 🔤 Reglas del rosco

Cada rosco tiene 26 letras y mantiene una distribución aproximada del 70/30:

- 18 preguntas **Empieza por**.
- 8 preguntas **Contiene**.

El reparto exacto posible en 26 preguntas es 69,2 % / 30,8 %. Las letras aparecen en un círculo inspirado en una Poké Ball, con el símbolo de cada mini-ficha en el fondo y la letra siempre en primer plano.

## 🔁 Preguntas sin repetición

El banco local contiene 2.080 preguntas:

- 520 para cada dificultad.
- 20 candidatas para cada letra dentro de cada dificultad.

Al comenzar una partida se selecciona una pregunta nueva para cada letra. El historial se guarda en el almacenamiento local del navegador, así que pulsar **Jugar de nuevo** no repite automáticamente las preguntas utilizadas.

Cuando una dificultad se queda sin preguntas nuevas, la aplicación muestra un aviso. La rotación solo puede reiniciarse pulsando **Reiniciar rotación** de forma explícita.

## 🎨 Estética y experiencia

La interfaz utiliza una dirección visual propia basada en:

- Pixel-art y tipografía arcade **Press Start 2P**.
- Fondo oscuro con sprites pixelados y scanlines CRT.
- Amarillo eléctrico, azul, verde, naranja y rojo para estados y acciones.
- Rosco circular en lugar de una cuadrícula.
- Mini Poké Balls semitransparentes dentro de cada letra.
- Animaciones breves y minimalistas para la letra activa.
- Diseño responsive para móvil, tablet y escritorio.

## 🚀 Ejecutar en local

Necesitas Python o cualquier servidor de archivos estáticos.

Desde la raíz del proyecto:

```bash
python -m http.server 8080 -d demo
```

Abre después:

```text
http://localhost:8080/
```

No abras `demo/index.html` directamente con `file://`, porque el navegador puede bloquear la carga del banco JSON.

### Validar el contenido

```bash
node demo/validate-content.mjs
node scripts/simulate-games.mjs
```

### Regenerar las preguntas

```bash
node scripts/build-question-bank.mjs
```

El generador utiliza una caché local de datos de PokéAPI y deja las preguntas empaquetadas en `demo/data/question-bank.json`. La partida no necesita consultar Internet en tiempo de ejecución.

## 🌐 Publicación

La demo se publica automáticamente en GitHub Pages mediante GitHub Actions:

👉 [https://bertmarti.github.io/Roscodex/](https://bertmarti.github.io/Roscodex/)

El workflow publica únicamente la carpeta `demo/` como sitio estático.

## 🗂️ Estructura del proyecto

```text
Roscodex/
├── demo/                       # Aplicación web jugable
│   ├── assets/                 # Tipografía, sprites y arte del README
│   ├── data/                   # Banco de preguntas y caché local
│   ├── app.js                  # Motor de partida e interacción
│   ├── index.html              # Pantallas y modales
│   └── styles.css              # Estética pixel-art responsive
├── doc/                        # Roadmap, agentes, decisiones y guía
├── scripts/                    # Generación y simulación de contenido
└── .github/workflows/          # Publicación en GitHub Pages
```

## 📚 Guía de usuario

Esta guía resume el funcionamiento dentro del propio README. También existe una versión independiente en [doc/10-guia-de-usuario.md](doc/10-guia-de-usuario.md), con solución de problemas y detalles de funcionamiento offline.

## 🔗 Fuentes y créditos

- [PokéAPI](https://pokeapi.co/) — datos estructurados de Pokémon.
- [PokéAPI Sprites](https://github.com/PokeAPI/sprites) — sprites cacheados para la demo.
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) — tipografía pixel de interfaz.

PokéReto es un proyecto fan no oficial. No está afiliado, patrocinado ni aprobado por Nintendo, Creatures Inc., GAME FREAK inc. ni The Pokémon Company.

## 🗺️ Roadmap

- [x] Demo web local y publicación en GitHub Pages.
- [x] Cuatro dificultades con tiempos diferenciados.
- [x] Rosco circular A-Z con estados visuales.
- [x] Banco local de 2.080 preguntas.
- [x] Rotación persistente sin repetición automática.
- [x] Validación automática y simulación de partidas.
- [ ] Revisión editorial humana de todas las preguntas.
- [ ] Traducción y normalización de nombres de movimientos y habilidades.
- [ ] Portar la experiencia a Flutter para Android/iOS.
- [ ] Modo práctica sin temporizador.
- [ ] Récords locales y estadísticas personales.

## ❤️ Nota final

PokéReto es una experiencia experimental hecha para aprender, jugar y explorar una interfaz de rosco con estética pixel-art. No requiere cuentas ni pagos y está pensada para mantenerse gratuita.
