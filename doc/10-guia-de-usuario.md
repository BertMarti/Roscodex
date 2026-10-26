# Roscodex — Guía de usuario

## ¿Qué es Roscodex?

Roscodex es un juego de preguntas tipo rosco inspirado en el formato de televisión de “Pasapalabra”, con estética pixel-art y temática Pokémon.

El objetivo es completar el rosco de la A a la Z respondiendo preguntas antes de que termine el tiempo, o jugar sin reloj a tu ritmo.

Es un proyecto fan, gratuito y no oficial. No está afiliado, patrocinado ni aprobado por Nintendo, GAME FREAK, Creatures Inc. ni The Pokémon Company.

## Cómo empezar

Abre la aplicación desde la [versión publicada](https://bertmarti.github.io/Roscodex/).

En la pantalla inicial elige primero el modo:

- **Con reloj**: una partida con el tiempo de la dificultad elegida.
- **Contrarreloj 2:00**: completa todo el rosco en dos minutos, en cualquier dificultad, con récords propios.
- **Práctica (sin reloj)**: juega con calma y sin temporizador.

El juego recuerda el modo que hayas elegido. Después selecciona uno de los cuatro niveles de dificultad:

| Nivel | Tiempo | Tipo de preguntas |
|---|---:|---|
| Principiante | 6 minutos | Tipos y generaciones, sin datos técnicos complejos |
| Normal | 5 minutos | Datos combinados y algún dato técnico sencillo |
| Difícil | 4 minutos | Varias condiciones, estadísticas, habilidades o movimientos |
| Extremo | 3 minutos | Combinaciones avanzadas de datos de combate |

Si es tu primera vez, la portada muestra **¿Primera vez?**: pulsa **Jugar partida guiada** para que el juego te explique cómo jugar mientras avanzas, sin reloj. También puedes consultar en cualquier momento el botón **Cómo se juega** de la portada.

## Cómo se juega

Al comenzar una partida aparecen:

1. El temporizador, salvo en Práctica.
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

La regla aparece tanto en el encabezado de la pregunta como dentro del enunciado. El rosco tiene 18 preguntas de tipo **Empieza por** y 8 de tipo **Contiene**.

Las respuestas usan los nombres oficiales en español de Pokémon, movimientos y habilidades. Las alturas y los pesos llevan coma decimal, por ejemplo, **0,7 m**.

## Responder una pregunta

Pulsa una de las cuatro respuestas, o usa las teclas `1`, `2`, `3` y `4`:

- Si es correcta, se marca en verde y recibes **+10 puntos**.
- Si es incorrecta, se marca en rojo y se muestra la respuesta correcta con una línea que la explica, indicando su tipo y generación.
- Después de un fallo, pulsa **Siguiente ›** o `Intro` para continuar. Con reloj, el juego continúa solo a los pocos segundos (2,6 s); sin reloj espera hasta que pulses el botón.

La tecla `P` activa **Pasapalabra**.

Las letras del rosco cambian de estado para mostrar el progreso:

- Pendiente (casilla oscura).
- Activa, la pregunta en curso (amarillo).
- Correcta (verde).
- Incorrecta (rojo).
- Pasada (azul).
- Tiempo agotado (gris).

## Usar Pasapalabra

Pulsa **Pasapalabra** cuando no quieras responder en ese momento, o usa la tecla `P`.

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

En las partidas con reloj y en las contrarrelojes también muestra el récord de la dificultad. Si superas el anterior, aparece **¡Nuevo récord!** Las partidas de práctica no cuentan para los récords, pero sí para las estadísticas.

Desde ahí puedes pulsar **Compartir resultado**. Se abre el menú de compartir del sistema; si no está disponible, el resultado se copia al portapapeles o se muestra un texto para copiarlo a mano. Solo incluye los puntos, los contadores y una fila de cuadritos **🟩🟥⬜**: no incluye ningún dato personal.

También puedes pulsar **Jugar de nuevo** para iniciar otra partida con el mismo modo y dificultad, o **Cambiar dificultad** para volver a la pantalla inicial.

## Estadísticas

El botón **▤ Estadísticas** de la portada muestra, entre otros datos:

- Partidas jugadas.
- Aciertos totales y porcentaje de acierto.
- Mejor racha de aciertos seguidos.
- Preguntas falladas y pasadas.
- Aciertos por letra y la letra que más cuesta.
- Récords de las partidas con reloj y de las contrarrelojes, por dificultad.

Puedes borrarlas con **Borrar estadísticas** y confirmando con **Borrar** (se borran también los récords; no se puede deshacer). Todo se queda en tu dispositivo.

## Accesibilidad y ajustes

- El botón de sonido activa o desactiva los efectos de sonido 8-bit y recuerda tu preferencia.
- **Alto contraste** se activa automáticamente si el sistema pide más contraste. También puedes forzarlo o quitarlo desde el interruptor de la portada.
- **‹ Menú** permite abandonar la partida tras una confirmación. El reloj se pausa mientras decides.
- Los lectores de pantalla reciben avisos cuando aparece una pregunta nueva y cuando quedan 60, 30 o 10 segundos.

## Preguntas sin repetición

La aplicación dispone de un banco local de 2.080 preguntas, 520 para cada nivel de dificultad. Al empezar cada partida se seleccionan preguntas nuevas para gestionar la rotación.

Cuando se agotan las preguntas de una dificultad, la aplicación muestra un aviso y ofrece **Reiniciar rotación**. La rotación no se reinicia por su cuenta.

## Funcionamiento sin conexión

La PWA permite jugar sin conexión después de abrir la web por primera vez. Si el navegador lo permite, en la portada aparece el botón **⇩ Instalar app**. En iPhone y iPad aparece **Instalar en iPhone**, con los pasos para usar Compartir y **Añadir a la pantalla de inicio**.

Cuando haya una versión nueva verás el aviso **Hay una versión nueva de Roscodex**. Puedes pulsar **Recargar** o **Luego**; el aviso nunca interrumpe una partida.

## Proyecto fan y fuentes

Roscodex utiliza datos de [PokéAPI](https://pokeapi.co/), sprites de [PokéAPI Sprites](https://github.com/PokeAPI/sprites) y la tipografía [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P). Las fuentes y la información legal están disponibles en **Fuentes y créditos**, en la pantalla inicial.

## Problemas habituales

### La página aparece vacía o no carga las preguntas

La puesta en marcha local y los problemas técnicos relacionados con la aplicación se explican en la [guía de desarrollo](DESARROLLO.md).

### Quiero empezar de cero

Si se han agotado las preguntas de una dificultad, pulsa **Reiniciar rotación**. Para borrar las estadísticas y los récords, entra en **▤ Estadísticas** y pulsa **Borrar estadísticas**.

Si quieres borrar todos los datos de Roscodex, elimina solo las claves que empiezan por **roscodex-**. Si instalaste la app, también puedes desinstalarla. No borres todos los datos del sitio, porque la web comparte origen con otras webs de `bertmarti.github.io`.

### La aplicación funciona, pero no veo sprites

Los problemas técnicos de recursos y de desarrollo se explican en la [guía de desarrollo](DESARROLLO.md).

## Estado actual del proyecto

La versión actual es la **1.0.0**, la primera versión estable. Incluye los modos con reloj, contrarreloj y práctica, partida guiada, estadísticas, récords, compartir resultado, alto contraste y una PWA instalable que funciona sin conexión. El número de versión se ve al pie de la portada y en **«Fuentes y créditos»**.

Sigue sin incluir cuentas, ranking online, multijugador ni sincronización entre dispositivos.
