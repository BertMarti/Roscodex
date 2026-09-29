# Auditoría de mejoras y contexto acumulado

**Fecha:** 2026-09-19  
**Estado:** segunda iteración aplicada y verificada en la demo local  
**Nombre de la aplicación:** Roscodex
**Referencia visual revisada:** https://adivina-quien-pokemon.vercel.app/

## 1. Contexto acumulado del proyecto

La idea original es una aplicación móvil de tipo rosco de preguntas, inspirada en el formato de “Pasapalabra”, con temática fan de Pokémon.

Requisitos funcionales acumulados:

- Pantalla inicial de selección de dificultad.
- Cuatro niveles: principiante, normal, difícil y extremo.
- Rosco A-Z en la primera demo.
- Preguntas que pueden comenzar por una letra o contenerla.
- Aproximadamente 70 % de preguntas de “Empieza por…” y 30 % de “Contiene…”.
- Cuatro respuestas posibles y una opción “Pasapalabra”.
- Feedback verde para acierto y rojo para fallo.
- Letras pasadas conservadas para una segunda vuelta.
- Temporizador global por dificultad.
- Funcionamiento gratuito y local.
- Proyecto fan con créditos y fuentes dentro de un panel no invasivo.
- Estética pixel-art inspirada en juegos Pokémon clásicos, sin copiar una interfaz oficial.

Decisiones técnicas anteriores:

- Demo web estática para validar rápidamente la experiencia.
- Flutter + Dart como destino posterior para la aplicación móvil.
- JSON local para preguntas.
- PokéAPI para recopilar datos, no como dependencia obligatoria durante la partida.
- Sprites cacheados localmente.
- Fuente `Press Start 2P` incluida localmente con su licencia.
- Sin login, backend, ranking ni publicidad en el MVP.

## 2. Agentes utilizados en la auditoría

Se aplicaron las responsabilidades de los agentes definidos en `doc/agents`.

### Product Owner

Conclusiones:

- El nombre “El rosco pixelado” no comunica la temática Pokémon ni tiene fuerza de marca.
- **Roscodex** es el nombre definitivo de la aplicación y conserva la referencia directa al formato de rosco.
- El rosco debe ser reconocible en menos de un segundo.
- Cada ficha del rosco debe reforzar la temática sin competir con la pregunta.

### UX/UI Pixel-Art

Conclusiones:

- El fondo de sprites, scanlines y tarjetas oscuras ya crea el lenguaje visual correcto.
- Las fichas cuadradas de las letras debilitaban la lectura de “rosco”.
- Las letras deben ser círculos independientes, con estados de alto contraste.
- El fondo puede ser expresivo, pero la pregunta y sus respuestas deben permanecer en primer plano.
- La leyenda de estados ayuda a no depender solo del color.

### Content & PokéAPI

Conclusiones:

- La partida debe continuar funcionando sin red.
- Los sprites se utilizan como ambientación visual y deben estar cacheados.
- Las preguntas deben seguir en JSON, con fuente, categoría, explicación y estado de revisión.
- La revisión editorial de las preguntas es más importante que añadir más APIs.

### Game Engine

Conclusiones:

- El flujo de cola y segunda vuelta es válido para esta demo.
- El fin por tiempo necesitaba un estado explícito `expired`.
- El resultado necesitaba un guard para no abrirse dos veces si coinciden el temporizador y la transición de feedback.

### Assets & Attribution

Conclusiones:

- Los sprites actuales están descargados localmente y no se solicitan durante la partida.
- La licencia del repositorio de sprites se conserva dentro de `demo/assets/sprites/LICENCE.txt`.
- La fuente `Press Start 2P` y su licencia están dentro de `demo/assets/fonts/`.
- El aviso de proyecto fan sigue visible, pero agrupado para no invadir la pantalla.

### QA & Accessibility

Conclusiones:

- La navegación principal funciona.
- La respuesta correcta actualiza el estado y avanza.
- Pasapalabra conserva la letra para segunda vuelta.
- No hay errores de consola en la carga y prueba manual.
- Los estados tienen color y texto/forma, aunque habrá que añadir más pruebas con texto aumentado.

### Local Tooling

Conclusiones:

- La demo se ejecuta con Python sin instalar un stack adicional.
- El servidor local es suficiente para cargar el JSON y los assets.
- Flutter aún no está instalado, por lo que la web sigue siendo la superficie de validación rápida.

## 3. Mejoras aplicadas en esta iteración

### Rosco Pokéball

La Pokéball grande central se ha eliminado. La decisión visual definitiva es:

1. Las letras A-Z forman la circunferencia del rosco.
2. Cada ficha circular contiene una mini-Pokéball como fondo semitransparente.
3. La mini-Pokéball se construye con mitad roja, línea central oscura, mitad clara y botón central.
4. La letra se renderiza en una capa superior, plana y sin relieve, para mantener la lectura.
5. Los estados de juego cambian el color de la ficha sin eliminar la silueta temática de fondo.

Los estados actuales son:

| Estado | Tratamiento |
|---|---|
| Pendiente | Círculo oscuro con borde gris azulado |
| Activa | Amarillo con animación de latido |
| Correcta | Verde |
| Incorrecta | Rojo |
| Pasada | Azul |
| Tiempo agotado | Gris atenuado |

### Identidad visual

- “Roscodex” sustituye a “El rosco pixelado” y a “PokéReto” en la interfaz.
- El subtítulo es “El desafío de las letras”.
- Se mantiene el tono fan, pero con una marca más breve.
- El panel principal utiliza una jerarquía similar a una pantalla de creación de partida.

### Feedback y legibilidad

- Se ha añadido una leyenda debajo del rosco.
- La leyenda incluye pendiente, acierto, fallada, pasada y tiempo agotado.
- Las letras son circulares, planas y tienen contraste propio.
- La pregunta mantiene una tarjeta separada del fondo.
- La pregunta y las respuestas conservan prioridad visual sobre los sprites.

### Preguntas y respuestas

- Se han intercalado los tipos de pregunta entre A-Z.
- El pack tiene 18 preguntas `starts_with` y 8 `contains`.
- Con 26 letras no existe un reparto exacto 70/30 en números enteros: 18/8 es el equilibrio más cercano, 69,2 % y 30,8 %. Para conseguir un 70/30 exacto habrá que ampliar el banco a un tamaño compatible, por ejemplo 100 preguntas.
- Las opciones se barajan en cada partida.
- Cada pregunta incluye categoría, explicación, dificultad y fuente.
- `demo/validate-content.mjs` comprueba letras, opciones, regla y distribución.
- Se añadieron packs alternativos `normal-001`, `hard-001` y `extreme-001` en `demo/data/question-packs.json`.
- La dificultad prioriza su pack y el historial local evita repetir inmediatamente el último pack al pulsar “Jugar de nuevo”.
- Se añadió un generador basado en PokéAPI en `scripts/build-question-bank.mjs`.
- El banco compilado contiene 520 preguntas por dificultad, 20 por letra y 2.080 preguntas únicas en total.
- La partida selecciona solo 26 preguntas —una por letra— y nunca intenta dibujar las 520 en el rosco.
- El historial actual `roscodex-question-history-v4` reserva IDs usados por dificultad y migra el historial antiguo de `pokereto-question-history-v3`.
- Cuando se agota una dificultad, la interfaz muestra “No quedan preguntas nuevas” y no borra el historial automáticamente; reiniciar la rotación requiere una acción explícita.
- `scripts/simulate-games.mjs` simula 20 roscos por dificultad y verifica que se consumen 520 IDs únicos por banco.
- El estado de fuente del banco generado es `generated-validated`: la validación automática confirma regla, opciones, distribución y trazabilidad de PokéAPI; queda pendiente una revisión editorial humana de los 2.080 enunciados, especialmente nombres de movimientos y habilidades.
- En esta iteración se eliminó el lenguaje de “Pista directa/combinada/avanzada/experta”. Todos los enunciados generados comienzan por `Empieza por la letra X.` o `Contiene la letra X.`.
- Principiante quedó restringido a tipos y generación en texto; el validador rechaza peso, altura, experiencia, estadísticas, movimientos, habilidades y otros datos numéricos avanzados en ese nivel.
- Normal, difícil y extremo aumentan progresivamente la cantidad de condiciones y datos técnicos. PokéAPI sigue siendo la fuente estructurada de tipos, generaciones, altura, peso, estadísticas, habilidades y movimientos. [Documentación oficial de PokéAPI](https://pokeapi.co/docs/v2).

### Robustez del motor

- Se añadió el estado `expired` para la letra activa cuando llega el tiempo a cero.
- Se añadió `state.finished` para evitar finalizar dos veces la misma partida.
- El resultado ya no debería abrirse dos veces por una carrera entre el temporizador y el feedback.
- El resultado distingue entre `Tiempo agotado` y `Reto completado`.
- Las respuestas se identifican por `option.id`, no por el texto visible.
- En pantallas de hasta 410 px el radio del rosco se compacta para evitar scroll horizontal.
- La letra activa queda por encima de las demás durante el latido.

## 3.1 Informes de los agentes ejecutados

### Auditor de aplicación

- No encontró incidencias P0.
- Confirmó el flujo completo, la carga local, los créditos y la ausencia de errores de consola.
- Dejó como P1 futuro añadir más de un pack por dificultad, además de abandono y mejora del mensaje de error de carga.

### Revisor UI/UX pixel Pokémon

- Confirmó que cada ficha contiene una mini-Pokéball de fondo y que las letras son circulares, planas y legibles.
- Detectó scroll horizontal en 320 px y riesgo de solapamiento de la letra activa; ambos quedan corregidos en esta iteración.
- Recomendó conservar colores planos y reforzar el pixel-art con bloques, no con sombras o relieve.

### Optimizador de preguntas y respuestas

- Confirmó 26 letras, cuatro opciones únicas, reglas coherentes y tipos intercalados.
- Confirmó que 18/8 es la proporción más próxima posible a 70/30 en un rosco de 26 letras.
- Recomendó ampliar la trazabilidad con endpoint, campos consultados y fecha de revisión.

### Revisión de dificultad y formato — iteración actual

- Se revisó el generador y se eliminó la nomenclatura editorial de “Pista”.
- El validador ahora exige que cada pregunta comience por `Empieza por la letra X.` o `Contiene la letra X.`.
- Principiante queda limitado a tipos y generación escrita; no puede introducir peso, altura, número de Pokédex, experiencia, estadísticas, movimientos ni habilidades.
- Se ampliaron las plantillas de Normal, Difícil y Extremo para evitar que la eliminación de las etiquetas de pista produzca duplicados exactos.
- Se regeneró el banco con la caché de 1.025 Pokémon de PokéAPI y se volvieron a ejecutar validador y simulador.

## 4. Mejoras recomendadas para las siguientes iteraciones

### Prioridad alta

- Añadir fuentes españolas para nombres de movimientos y habilidades, y revisión editorial de candidatos generados automáticamente.
- Añadir `source`, `retrievedAt` y `reviewStatus` a cada pregunta.
- Revisar todas las preguntas con un validador automático.
- Añadir botón de sonido y vibración opcionales.
- Añadir una pantalla breve de instrucciones antes de empezar.
- Probar la interfaz con texto grande y dispositivos de 320 px de ancho.
- Añadir una acción clara para abandonar una partida.

### Prioridad media

- Hacer que las letras del rosco puedan seleccionarse manualmente solo cuando estén pendientes.
- Mostrar un contador de letras completadas.
- Añadir racha de aciertos.
- Añadir categorías opcionales: Pokémon, tipos, movimientos, regiones y evoluciones.
- Permitir elegir generación o región.
- Añadir un modo práctica sin temporizador.
- Guardar récord local.

### Prioridad baja

- Packs descargables.
- Retos diarios.
- Ranking online.
- Multijugador.
- Migración completa a Flutter.

## 5. APIs y recursos recomendados

### PokéAPI

Usar para:

- Nombres y especies.
- Tipos.
- Habilidades.
- Movimientos.
- Evoluciones.
- Regiones y generaciones.
- Datos para redactar preguntas.

Estrategia: ejecutar un importador separado, revisar los datos y guardar un JSON local. No hacer una petición por pregunta durante una partida.

### PokéAPI Sprites

Usar como fuente de referencia para sprites pixelados cacheados. Mantener los archivos y su licencia dentro de `demo/assets/sprites/`.

No asumir que una licencia de repositorio elimina los derechos de marca o de los personajes representados. La demo se mantiene como fan, local y no comercial mientras no se haga una revisión legal adicional.

### Press Start 2P

Usar para títulos, etiquetas y estados cortos. Para textos largos se debe mantener una fuente sans-serif normal, porque la fuente pixel puede reducir la legibilidad.

## 6. Criterios de aceptación del rosco nuevo

- Cada ficha circular se percibe como una mini-Pokéball sin impedir la lectura de su letra.
- Las 26 letras forman una circunferencia.
- Cada letra es circular, no cuadrada.
- La letra activa se lee claramente sobre cualquier zona roja, negra o blanca.
- Los estados verde, rojo, azul y gris siguen diferenciándose.
- El rosco no invade la tarjeta de pregunta.
- La versión móvil no corta letras en los bordes.
- `prefers-reduced-motion` sigue reduciendo las animaciones.
- El rosco mantiene una etiqueta accesible para cada letra.

## 7. Estado de verificación

Comprobado en la demo local:

- Carga de la pantalla inicial.
- Selección de dificultad Normal.
- Rosco circular compuesto por fichas mini-Pokéball.
- 26 letras accesibles en el DOM.
- Pregunta activa y cuatro respuestas.
- Respuesta correcta y avance a la letra siguiente.
- Sin errores de consola.
- 26 preguntas JSON válidas.
- 18 preguntas “Empieza por…” y 8 preguntas “Contiene…”, intercaladas entre A-Z.
- Opciones de respuesta barajadas al comenzar cada pregunta.
- 25 sprites PNG locales.
- `node validate-content.mjs` correcto.
- `node --check app.js` correcto.
- `git diff --check` correcto.

## 8. Contexto para futuros agentes

Antes de modificar la interfaz o las reglas, leer este archivo junto con:

- `doc/README.md`
- `doc/01-roadmap-agentes.md`
- `doc/02-plan-demo-local.md`
- `doc/03-datos-apis-y-modelo.md`
- `doc/04-direccion-pixel-art.md`
- El documento específico del agente que vaya a trabajar.

La prioridad actual es mejorar claridad, jugabilidad y contenido sin añadir servicios de pago ni dependencias online obligatorias.
