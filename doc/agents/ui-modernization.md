# Agente UI/UX — Modernización visual de Roscodex

**Estado:** auditoría y propuesta, sin cambios de código

**Fecha:** 2026-09-29

**Alcance:** interfaz web actual de `demo/`, con criterios reutilizables para una futura aplicación móvil.

**Restricción principal:** conservar el lenguaje pixel-art y la lectura inmediata del rosco sin copiar logotipos, pantallas ni arte propietario de Pokémon.

## 1. Resumen ejecutivo

La demo tiene una identidad reconocible y coherente: fondo azul marino con scanlines, tipografía bitmap, paneles oscuros, colores semánticos y 26 fichas circulares. La dirección correcta no es añadir más efectos, sino convertir esa base en un sistema visual más ordenado y adaptable.

La modernización recomendada es:

1. Mantener el fondo CRT como ambientación secundaria y reducir su coste en móviles.
2. Dar más espacio al juego en escritorio con un layout de dos columnas: rosco y tarjeta de pregunta.
3. Mantener el rosco circular, pero aumentar la legibilidad y separar la ficha visual de su área táctil.
4. Usar la fuente pixel solo para títulos, etiquetas y números; los enunciados y respuestas deben usar una sans-serif legible.
5. Convertir estados, foco, feedback y modales en componentes semánticos accesibles.
6. Compartir tokens de diseño entre web y móvil para que una futura implementación en Flutter, React Native o una PWA no dependa de copiar CSS a mano.

## 2. Evidencia de la auditoría actual

### Fortalezas que se deben conservar

- El nombre `Roscodex` ya aparece en la cabecera y comunica mejor el producto.
- La pantalla de partida presenta dificultad, ronda, letra activa, tiempo y puntuación antes de la pregunta.
- El rosco se construye como una circunferencia real con las letras A-Z, no como una cuadrícula.
- Cada ficha contiene una mini-Pokéball en segundo plano y la letra se dibuja en una capa superior plana.
- Los estados `pending`, `active`, `correct`, `wrong`, `passed` y `expired` están separados en CSS.
- La tarjeta de pregunta mantiene la regla visible: `EMPIEZA POR LA LETRA X` o `CONTIENE LA LETRA X`.
- Las respuestas tienen botones reales, foco de teclado y un tamaño razonable.
- El proyecto ya incluye `prefers-reduced-motion`, fuente local y assets cacheados, lo que ayuda al modo offline.
- Los créditos fan están agrupados en un modal, evitando ocupar toda la pantalla de inicio.

### Problemas observados y prioridad

| Prioridad | Área | Observación | Consecuencia | Recomendación |
|---|---|---|---|---|
| P0 | Lectura | Press Start 2P se usa en demasiados textos pequeños y enunciados | Fatiga visual y peor lectura en móvil | Reservarla para display; usar sans-serif para pregunta, opciones, ayuda y créditos |
| P0 | Móvil | Las fichas bajan a 31 px en pantallas pequeñas | La letra activa y el estado se distinguen con dificultad | Mantener un glyph visual compacto, pero usar un hit-area independiente y un layout con escala controlada |
| P0 | Accesibilidad | Las fichas del rosco son `div` con `aria-label`, no controles interactivos | No pueden enfocarse ni accionarse con teclado o lector de pantalla | Si se permite saltar a una letra, usar `button`; si son solo indicadores, usar `aria-live`/lista de estados y no simular controles |
| P0 | Modal | El cierre por Escape existe, pero no hay foco inicial, foco atrapado ni devolución del foco | El teclado puede escapar al contenido de fondo | Implementar patrón de diálogo completo |
| P1 | Escritorio | El flujo sigue apilando rosco y pregunta en un shell estrecho de 770 px | Se desaprovecha espacio y aumenta el scroll vertical | Usar dos columnas desde 960 px, manteniendo una columna en tablet y móvil |
| P1 | Estados | Los estados se apoyan mucho en color, aunque existe leyenda | Daltonismo y lectura rápida pueden perder información | Añadir patrón, icono o etiqueta breve además del color |
| P1 | Fondo | Se cargan 25 sprites decorativos de forma eager y se aplican blur, saturación y backdrop-filter | Trabajo innecesario en móviles y posibles tirones | Reducir cantidad, cargar de forma diferida y desactivar blur pesado en `prefers-reduced-data` o viewport pequeño |
| P1 | Feedback | La transición de respuesta espera 850 ms para avanzar | Puede sentirse lenta en partidas rápidas y no hay una zona de estado de turno clara | Mantener una pausa breve configurable, anunciar el resultado y mostrar la siguiente letra de forma estable |
| P1 | Orientación | No hay tratamiento específico para landscape móvil o notch/safe area | El temporizador y la tarjeta pueden quedar comprimidos | Añadir safe areas, breakpoints por ancho y altura, y una composición de dos zonas en landscape |
| P2 | Marca | El orb de marca sigue siendo una Pokéball genérica con pseudo-elementos | Es reconocible, pero puede sentirse como un recurso provisional | Crear un emblema original de Roscodex basado en un anillo, píxel central y letras RX; reservar la Pokéball para el rosco |
| P2 | Personalización | No existe control visible de sonido, vibración o contraste | Falta control sobre estímulos y preferencias | Añadir preferencias locales: sonido, vibración, movimiento reducido y contraste alto |

## 3. Dirección visual propuesta

### Principios

- **Primero el reto:** el enunciado, el tiempo y las cuatro respuestas siempre dominan al fondo.
- **Pixel por construcción:** usar bloques, bordes duros, líneas de 1–2 px y patrones discretos; no simular profundidad con bevels o sombras 3D.
- **Pokémon por lenguaje, no por copia:** usar colores de aventura, mini-Pokéballs abstractas, paneles de selección y nomenclatura fan; no reproducir una pantalla oficial ni depender de sprites para que la interfaz tenga personalidad.
- **Una señal, varias vías:** color + icono/patrón + texto accesible para cada estado.
- **Responsive por composición:** no encoger todo el diseño de escritorio hasta hacerlo ilegible.
- **Tacto antes que decoración:** cualquier acción principal debe poder pulsarse sin precisión de píxel.

### Composición recomendada

#### Escritorio, desde 960 px

```text
┌──────────────────────────────────────────────────────────────┐
│ marca + dificultad + ronda              tiempo       puntos  │
├───────────────────────────────┬──────────────────────────────┤
│                               │                              │
│          ROSCO A-Z             │       tarjeta de pregunta    │
│       leyenda de estados       │      regla + enunciado       │
│                               │      respuestas 2 × 2       │
│                               │      pasapalabra + feedback  │
└───────────────────────────────┴──────────────────────────────┘
```

El rosco debe ocupar una columna estable de 440–520 px. La tarjeta debe tener una anchura de 420–560 px y no competir con el rosco mediante un fondo demasiado brillante.

#### Tablet, entre 600 y 959 px

- Cabecera en una línea si hay altura suficiente.
- Rosco centrado arriba.
- Tarjeta debajo, con un ancho máximo de 680 px.
- Mantener una separación visible entre rosco, leyenda y pregunta.

#### Móvil, hasta 599 px

- Cabecera compacta con dificultad/ronda a la izquierda y tiempo a la derecha.
- Rosco arriba con diámetro máximo `min(92vw, 390px)` y sin elementos fuera del viewport.
- Pregunta debajo con respuestas a una columna solo cuando el ancho sea muy reducido o haya texto largo.
- En landscape móvil, usar dos columnas si la altura disponible es menor de 520 px: rosco a la izquierda y pregunta con scroll propio a la derecha.
- Respetar `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` y `100dvh`.

## 4. Tokens visuales

Los tokens deben vivir en una capa común de diseño. En web pueden ser variables CSS; en Flutter/React Native deben existir como un objeto equivalente. No definir colores directamente dentro de cada componente.

### Color

| Token | Valor recomendado | Uso |
|---|---|---|
| `bg.canvas` | `#070A14` | Fondo principal |
| `bg.canvasRaised` | `#0D1222` | Capas secundarias |
| `surface.panel` | `#181C2C` | Tarjetas y modales opacos |
| `surface.panelSoft` | `#111625` | Respuestas y controles |
| `border.default` | `#626B84` | Bordes principales |
| `border.subtle` | `#2B3248` | Separadores y estados inactivos |
| `text.primary` | `#F4F6FB` | Preguntas y respuestas |
| `text.secondary` | `#B1B8CA` | Ayuda, leyendas y créditos |
| `accent.yellow` | `#FFD21A` | Activo, foco, tiempo y marca |
| `state.correct` | `#35D07B` | Acierto |
| `state.wrong` | `#F35C6B` | Fallo |
| `state.passed` | `#6D87FF` | Pasapalabra |
| `state.expired` | `#7D8498` | Tiempo agotado |

Regla de contraste: texto normal y respuestas deben alcanzar al menos WCAG AA sobre su superficie. El amarillo se reserva para texto grande, borde o icono; no usarlo como párrafo pequeño sobre blanco.

### Tipografía

| Token | Valor | Uso |
|---|---|---|
| `font.display` | Press Start 2P local | Marca, títulos cortos, etiquetas, puntuación |
| `font.body` | system sans-serif | Enunciado, respuestas, modal, créditos |
| `size.body` | 16 px mínimo en móvil | Pregunta y respuestas |
| `size.bodyCompact` | 14 px | Metadatos secundarios |
| `size.display` | 20–32 px | Títulos de pantalla |
| `line.body` | 1.45–1.65 | Lectura de prosa |
| `line.display` | 1.35–1.55 | Títulos pixelados |

No usar Press Start 2P para enunciados largos. Si el diseño necesita una sensación más pixel, aplicar un marco, cursor, icono o separador pixelado, no reducir la legibilidad del texto.

### Espaciado, forma y movimiento

| Token | Valor | Uso |
|---|---:|---|
| `space.1`–`space.6` | 4, 8, 12, 16, 24, 32 px | Ritmo vertical y horizontal |
| `radius.panel` | 14 px | Paneles grandes |
| `radius.control` | 8 px | Botones y campos |
| `border.pixel` | 2 px | Bordes principales |
| `touch.min` | 44 × 44 px | Área de interacción recomendada |
| `motion.fast` | 120 ms | Hover/foco |
| `motion.feedback` | 500–750 ms | Resultado de respuesta |
| `motion.heartbeat` | 900 ms | Letra activa |

Las sombras deben ser cortas y opacas, por ejemplo `0 3px 0 #050711`, para simular una pieza de interfaz pixel. Evitar `box-shadow` difuso y `backdrop-filter` en controles esenciales.

## 5. Componentes y comportamiento

### 5.1 Cabecera de partida

Debe agrupar cuatro datos sin competir entre ellos:

- marca compacta `ROSCODEX`;
- dificultad y ronda;
- temporizador;
- puntos.

En móvil, dificultad y ronda pueden ser una sola línea secundaria. El temporizador debe ser un elemento semántico con texto, no solo color. En estado de peligro mostrar, por ejemplo, `00:29 · QUEDAN 30 S`, además de un cambio de borde y una animación reducida.

### 5.2 Rosco

La forma definitiva debe seguir siendo una circunferencia de 26 fichas. Cada ficha se compone de tres capas:

1. **Base de estado:** círculo plano de color semántico.
2. **Pokéball de fondo:** mitad roja, línea central y botón con opacidad baja; nunca debe superar la fuerza visual de la letra.
3. **Glyph:** letra plana, centrada, sin `text-shadow` 3D ni `-webkit-text-stroke` grueso.

Recomendaciones concretas:

- Mantener el centro visual libre; no añadir una Pokéball gigante detrás de todo el rosco.
- Usar una ficha visual de 34–46 px según viewport y un contenedor de interacción de al menos 44 px cuando la ficha sea accionable.
- La posición debe calcularse con variables de diámetro/radio y no con valores dispersos en JS.
- La letra activa debe tener un anillo amarillo y un pulso de baja amplitud; no aumentar tanto que invada a las fichas vecinas.
- Añadir una micro-etiqueta accesible: `A, pendiente`, `B, correcta`, etc.
- Si las fichas no permiten saltar de pregunta, mantenerlas como indicadores y no darles apariencia de botones.
- Si se habilita navegación directa, permitir únicamente letras pendientes o pasadas y confirmar el cambio de pregunta sin perder el foco.

Estados visuales mínimos:

| Estado | Color | Señal adicional |
|---|---|---|
| Pendiente | fondo oscuro + borde azul grisáceo | punto vacío o textura diagonal muy sutil |
| Activa | amarillo | anillo doble + `aria-current`/texto de turno |
| Correcta | verde | check pixelado o patrón de puntos |
| Incorrecta | rojo | cruz pixelada |
| Pasada | azul | flecha de retorno o símbolo `↻` |
| Tiempo | gris | reloj pixelado o trama atenuada |

El patrón adicional debe ser discreto y mantenerse visible en escala de grises. No poner una X enorme encima de la letra: la respuesta debe seguir siendo identificable.

### 5.3 Leyenda y progreso

La leyenda actual es útil, pero puede mejorar con:

- contador `08/26` junto a la ronda;
- resumen compacto `6 acertadas · 1 fallada · 2 pasadas`;
- leyenda colapsable en móvil si ocupa demasiado;
- texto alternativo que no dependa del color.

El progreso debe ser informativo, no otro bloque que compita con la tarjeta.

### 5.4 Tarjeta de pregunta

Orden visual recomendado:

1. `DESAFÍO ACTIVO` como metadato.
2. Regla en una etiqueta de alto contraste.
3. Enunciado en sans-serif, 16–20 px según ancho.
4. Respuestas como botones con numeración opcional `1–4`.
5. `Pasapalabra` como acción secundaria claramente separada.
6. Feedback persistente hasta que la siguiente pregunta sea visible.

El enunciado debe poder ocupar varias líneas sin provocar saltos bruscos en la posición de los botones. Reservar una altura mínima, pero permitir crecimiento cuando el texto sea largo. Las respuestas deben poder leerse sin depender de mayúsculas pixeladas.

Durante la corrección:

- desactivar todas las opciones para evitar doble respuesta;
- mantener visible la correcta y marcar la elegida si fue incorrecta;
- anunciar `Correcto`, `Incorrecto: era X` o `Pasapalabra` en una región `role="status"`;
- no usar solo un flash de color que desaparezca antes de que el usuario pueda interpretarlo.

### 5.5 Inicio y dificultad

La pantalla inicial debe mantener cuatro tarjetas de dificultad, pero mostrar la decisión de forma más rápida:

- nombre grande;
- duración;
- una frase de contenido, no una explicación técnica larga;
- estado de selección con borde y marca, no solo hover;
- área táctil completa de la tarjeta.

No mostrar el banco de preguntas ni la complejidad interna en primer plano. Esa información pertenece a créditos o a una pantalla de ayuda.

### 5.6 Créditos y preferencias

El modal actual de créditos debe convertirse en un diálogo accesible o bottom sheet móvil:

- foco inicial en el título o botón de cierre;
- `Escape` y gesto de cierre en móvil;
- foco devuelto al botón que lo abrió;
- enlaces con destino y fuente claramente identificados;
- texto fan visible sin interrumpir la partida.

Las preferencias recomendadas, guardadas localmente, son sonido, vibración, movimiento reducido y contraste alto. Todas deben tener valor por defecto silencioso y no bloquear el juego.

## 6. Sonido y vibración como parte de UX

El audio debe ser opcional, breve y original o con licencia compatible. No usar música ni efectos extraídos de juegos de Pokémon. La experiencia debe funcionar igual con el sonido desactivado.

Mapa de eventos recomendado:

| Evento | Señal | Regla |
|---|---|---|
| Selección de dificultad | blip corto ascendente | 80–120 ms |
| Letra activa | pulso leve | no repetir a volumen alto en cada tick |
| Acierto | dos notas ascendentes | 180–300 ms |
| Fallo | tono corto descendente | sin sonido agresivo |
| Pasapalabra | barrido breve | no confundir con fallo |
| Últimos 30 s | pulso cada 5 s como máximo | desactivable y nunca continuo |
| Resultado | fanfarria corta | límite de 1 s |

La implementación debe exponerse como un servicio de eventos desacoplado del motor: `sound.play("correct")`, `haptics.trigger("wrong")`. Así se podrá mapear a Web Audio en web y a un plugin nativo en móvil sin contaminar los componentes.

## 7. Rendimiento y portabilidad web/móvil

### Web/PWA

- Mantener el banco local y sin peticiones durante la partida.
- No cargar 25 sprites eager si no aportan información; usar un fondo con CSS y un conjunto reducido de sprites diferidos.
- Reservar `backdrop-filter`, blur y animaciones continuas para escritorio; en móviles usar superficies opacas.
- Aplicar `content-visibility: auto` a regiones secundarias que no estén en pantalla.
- Preconectar o descargar solo recursos realmente locales; evitar fuentes externas en tiempo de ejecución.
- Mantener el documento usable con teclado, zoom de texto y lector de pantalla.
- Si se convierte en PWA, añadir manifest, iconos originales y service worker; no cambiar el contrato de preguntas.

### Aplicación móvil

La implementación móvil debería consumir un contrato de diseño compartido, no una imagen de la web:

- `DesignTokens`: colores, tipografía, espaciado, radios, tamaños y motion.
- `QuestionViewModel`: regla, letra, enunciado, opciones, estado y feedback.
- `RoscoState`: mapa A-Z de estados y letra activa.
- `Preferences`: sonido, vibración, contraste y movimiento reducido.

Flutter es una buena candidata para una app Android/iOS de coste cero porque permite conservar una UI custom pixelada, renderizar el rosco con un `CustomPainter` y compartir la lógica offline. La web debe seguir siendo la superficie de validación rápida. La decisión final del stack debe hacerse después de construir una vertical slice con estos contratos, no antes.

## 8. Arte y licencias

- El rediseño base debe poder funcionar solo con CSS, SVG propio y la fuente local con licencia documentada.
- Los iconos de estado deben ser originales y sencillos: check, cruz, flecha circular, reloj y punto.
- Los sprites de PokéAPI pueden mantenerse en la demo fan con su atribución actual, pero no deben ser un requisito para entender la pantalla.
- Cualquier sprite procedente de SpriteCollab u otra colección debe revisarse archivo por archivo: licencia, autor, redistribución, relación con personajes y texto de créditos. No incorporar una colección por el mero hecho de estar publicada en GitHub.
- No reutilizar logotipos oficiales, capturas de juegos, música ni sonidos extraídos de ROMs o vídeos.
- Si se añaden sonidos, preferir síntesis Web Audio o archivos CC0/CC BY correctamente atribuidos, manteniendo una tabla de licencia en la documentación de assets.

## 9. Criterios de aceptación

### Visuales

- [ ] En un vistazo se reconoce un rosco circular A-Z.
- [ ] La Pokéball aparece dentro de cada ficha como textura de fondo, no como una figura gigante detrás del rosco.
- [ ] Las letras son planas, sin relieve 3D, y se leen sobre los seis estados.
- [ ] El fondo no compite con el enunciado ni con las respuestas.
- [ ] El diseño usa una paleta y espaciado consistentes mediante tokens.
- [ ] La interfaz se siente pixel-art por sus formas y ritmo, no por texto ilegible.

### Responsive

- [ ] No hay scroll horizontal entre 320 y 430 px.
- [ ] Ninguna letra queda cortada por el viewport en móvil.
- [ ] El rosco y la tarjeta forman dos columnas útiles desde 960 px.
- [ ] Tablet y móvil mantienen una jerarquía estable al cambiar el tamaño del texto.
- [ ] Landscape móvil no oculta el temporizador ni las acciones.
- [ ] Se respetan safe areas y `100dvh`.

### Accesibilidad

- [ ] El cuerpo de pregunta y respuestas usa al menos 16 px en móvil.
- [ ] Todo control tiene foco visible y área de interacción de al menos 44 × 44 px cuando sea viable.
- [ ] Cada estado se comunica por color, forma/icono y texto accesible.
- [ ] Los modales gestionan foco, Escape, cierre y retorno de foco.
- [ ] El feedback se anuncia mediante una región de estado sin duplicar mensajes.
- [ ] `prefers-reduced-motion` elimina pulso, desplazamientos y vibraciones visuales no esenciales.
- [ ] El juego sigue siendo comprensible con contraste alto y sin sonido.

### Rendimiento y privacidad

- [ ] Una partida completa no depende de una API online.
- [ ] Los recursos decorativos se cargan de forma proporcional al viewport y al dispositivo.
- [ ] En un móvil de gama media no se perciben tirones al cambiar de pregunta o estado.
- [ ] Las preferencias y el progreso local no contienen datos personales ni requieren cuenta.
- [ ] No se añade un servicio de pago ni una dependencia con coste obligatorio.

### QA visual

- [ ] Capturas de referencia comprobadas en 320 × 667, 390 × 844, 768 × 1024 y 1366 × 768.
- [ ] Se prueban estados pendiente, activa, correcta, incorrecta, pasada, tiempo agotado y banco completado.
- [ ] Se prueban preguntas cortas y largas, respuestas de una y varias palabras, y textos con tildes.
- [ ] Se prueba teclado, lector de pantalla básico, zoom al 200 % y movimiento reducido.
- [ ] Se verifica que los cambios de stack conserven el mismo contrato visual y de estados.

## 10. Plan de implementación recomendado

### Fase 1 — Contrato visual

- Convertir los tokens de este documento en un objeto compartido y variables CSS.
- Definir componentes de cabecera, rosco, tarjeta de pregunta, respuesta, feedback y modal.
- Crear una matriz de estados con color, icono, texto y comportamiento.

### Fase 2 — Responsive y accesibilidad

- Reorganizar el layout de escritorio en dos columnas.
- Corregir áreas táctiles, foco de modales y semántica de estados.
- Añadir landscape, safe areas, zoom y `prefers-reduced-motion`.

### Fase 3 — Rendimiento

- Medir el peso real de JSON, fuente y sprites.
- Reducir eager loading y efectos de blur en dispositivos pequeños.
- Comparar renderizado estable del rosco frente a regenerar todos los nodos en cada respuesta.

### Fase 4 — Audio y futura app móvil

- Incorporar un servicio opcional de sonido/vibración con assets auditados.
- Implementar una vertical slice móvil usando el contrato `DesignTokens`/`RoscoState`.
- Comparar Flutter con la PWA usando las mismas capturas y criterios de aceptación.

## 11. Decisión final del agente

La aplicación no necesita abandonar el lenguaje actual ni añadir más decoración. La mejora con mayor impacto es transformar la demo de una columna en un sistema responsive con tipografía de lectura, fichas circulares más claras, estados semánticos y componentes portables. El rosco y la mini-Pokéball ya son la idea correcta; deben ganar precisión, contraste y comportamiento, no volumen visual.

Este documento es una propuesta de diseño. No se ha modificado `demo/`, `README.md` ni ningún otro archivo.
