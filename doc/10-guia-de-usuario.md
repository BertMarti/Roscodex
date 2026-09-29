# PokéReto — Guía de usuario

## ¿Qué es PokéReto?

PokéReto es un juego de preguntas tipo rosco inspirado en el formato de televisión de “Pasapalabra”, con estética pixel-art y temática Pokémon.

El objetivo es completar el rosco de la A a la Z respondiendo preguntas antes de que termine el tiempo.

Es un proyecto fan, gratuito y no oficial. No está afiliado, patrocinado ni aprobado por Nintendo, GAME FREAK, Creatures Inc. ni The Pokémon Company.

## Cómo empezar

Abre la aplicación desde una de estas direcciones:

- Demo publicada: [bertmarti.github.io/Roscodex](https://bertmarti.github.io/Roscodex/)
- Demo local: `http://localhost:8080/`

En la pantalla inicial selecciona uno de los cuatro niveles de dificultad:

| Nivel | Tiempo | Tipo de preguntas |
|---|---:|---|
| Principiante | 6 minutos | Tipos y generaciones, sin datos técnicos complejos |
| Normal | 5 minutos | Datos combinados y algún dato técnico sencillo |
| Difícil | 4 minutos | Varias condiciones, estadísticas, habilidades o movimientos |
| Extremo | 3 minutos | Combinaciones avanzadas de datos de combate |

## Cómo se juega

Al comenzar una partida aparecen:

1. El temporizador.
2. El rosco circular con las letras de la A a la Z.
3. La puntuación actual.
4. La pregunta correspondiente a la letra activa.
5. Cuatro posibles respuestas.
6. El botón **Pasapalabra**.

La letra activa se muestra con una animación de pulso. Las letras del rosco utilizan una estética circular inspirada en una Poké Ball, manteniendo la letra plana y legible en primer plano.

## Tipos de pregunta

Cada pregunta indica siempre una de estas dos reglas:

- **Empieza por la letra X.** La respuesta debe comenzar por esa letra.
- **Contiene la letra X.** La respuesta debe contener esa letra en cualquier posición.

La regla aparece tanto en el encabezado de la pregunta como dentro del enunciado. No se utilizan etiquetas como “Pista directa” o “Pista experta”.

El reparto aproximado del rosco es:

- 18 preguntas de tipo **Empieza por**.
- 8 preguntas de tipo **Contiene**.

En un rosco de 26 letras no es posible representar un 70/30 exacto con números enteros; 18/8 equivale aproximadamente a 69,2 % y 30,8 %.

## Responder una pregunta

Pulsa una de las cuatro respuestas:

- Si es correcta, se marca en verde y recibes puntos.
- Si es incorrecta, se marca en rojo y se muestra la respuesta correcta.
- Después de responder, el juego avanza automáticamente a la siguiente letra.

Las letras del rosco cambian de estado para mostrar el progreso:

- Pendiente.
- Correcta.
- Incorrecta.
- Pasada.
- Tiempo agotado.

## Usar Pasapalabra

Pulsa **Pasapalabra** cuando no quieras responder en ese momento.

La pregunta queda marcada como pasada y se coloca para una segunda vuelta. Cuando termina la primera vuelta, el juego vuelve a las letras que se hayan pasado, siempre que todavía quede tiempo.

## Final de la partida

La partida termina cuando:

- Se han resuelto todas las preguntas disponibles.
- Se acaba el tiempo.

La pantalla de resultados muestra:

- Puntuación total.
- Respuestas correctas.
- Respuestas incorrectas.
- Preguntas pasadas.

Desde ahí puedes:

- Pulsar **Jugar de nuevo** para iniciar otra partida con la misma dificultad.
- Pulsar **Cambiar dificultad** para volver a la pantalla inicial.

## Preguntas sin repetición

La aplicación dispone de un banco local de 2.080 preguntas:

- 520 para Principiante.
- 520 para Normal.
- 520 para Difícil.
- 520 para Extremo.
- 20 candidatas para cada letra dentro de cada dificultad.

Al empezar cada partida se selecciona una pregunta nueva por letra. El historial se guarda en el almacenamiento local del navegador, por lo que cerrar y volver a abrir la página no borra automáticamente las preguntas utilizadas.

Cuando se han consumido todas las preguntas de una dificultad, la aplicación muestra un aviso y no reinicia la rotación por su cuenta. El reinicio del banco requiere pulsar la acción explícita **Reiniciar rotación**.

Si se borran los datos del navegador o se utiliza otro dispositivo, el historial local no estará disponible.

## Funcionamiento sin conexión

La partida no consulta una API en tiempo real. Las preguntas, los sprites y la tipografía se sirven desde archivos locales incluidos en la aplicación.

La conexión a Internet solo es necesaria para abrir la versión publicada por primera vez o para consultar los enlaces de fuentes y créditos.

## Proyecto fan y fuentes

PokéReto utiliza datos estructurados de [PokéAPI](https://pokeapi.co/), sprites de [PokéAPI Sprites](https://github.com/PokeAPI/sprites) y la tipografía [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P).

Los datos se importan y validan antes de guardarse en el banco local. Las fuentes y la información legal están disponibles en el botón **Fuentes y créditos** de la pantalla inicial.

## Problemas habituales

### La página aparece vacía o no carga las preguntas

Abre la aplicación mediante un servidor HTTP local. No abras directamente `index.html` con `file://`.

Desde la raíz del proyecto puedes ejecutar:

```bash
python -m http.server 8080 -d demo
```

Después visita `http://localhost:8080/`.

### Quiero empezar de cero

Borra los datos del sitio en el navegador. Esto eliminará el historial local de preguntas y la aplicación volverá a utilizar la rotación desde el principio.

### La aplicación funciona, pero no veo sprites

Comprueba que estás ejecutando la carpeta `demo/` desde un servidor HTTP y que no has movido la carpeta `assets/`.

## Estado actual del proyecto

Esta versión es una demo web local/publicada. Incluye el flujo principal del juego, el rosco completo, temporizador, respuestas, segunda vuelta, resultados, créditos y banco de preguntas local.

Todavía no incluye cuentas, ranking online, multijugador, sincronización entre dispositivos ni aplicación nativa para Android o iOS.
