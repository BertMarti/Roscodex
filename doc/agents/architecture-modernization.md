# Agente de arquitectura — modernización de Roscodex

**Fecha de auditoría:** 2026-09-29  
**Alcance:** auditoría de arquitectura y propuesta de migración.  
**Restricción aplicada:** este agente no modifica la aplicación ni los datos; únicamente crea este informe.

## 1. Veredicto ejecutivo

La demo actual funciona y es apropiada como prototipo visual, pero el JavaScript estático ya empieza a concentrar demasiadas responsabilidades en un único módulo. La recomendación es evolucionar hacia:

> **TypeScript + Vite + React + PWA offline-first, con Capacitor como capa móvil opcional.**

No recomiendo reescribir primero en Flutter ni en React Native.

El motivo principal no es que JavaScript sea automáticamente ineficiente. El tamaño de la interfaz actual no justifica una migración por velocidad bruta: 26 fichas, una tarjeta de pregunta y un banco local son una carga pequeña para un navegador moderno. El problema real es de mantenibilidad, tipado, pruebas, separación de responsabilidades, caché offline y empaquetado multiplataforma.

La propuesta conserva:

- la estética pixel-art existente basada en HTML/CSS;
- el rosco circular y sus estados;
- el banco de preguntas local y la regla de no repetir;
- la publicación gratuita en GitHub Pages;
- el funcionamiento web sin backend;
- la posibilidad de empaquetar la misma aplicación para Android y, con las herramientas adecuadas, iOS.

La migración debe ser gradual. La demo actual debe seguir siendo una referencia funcional hasta que la nueva superficie supere las pruebas de paridad.

## 2. Estado real auditado

### 2.1 Superficie actual

| Área | Estado observado | Consecuencia |
|---|---|---|
| Entrada web | `demo/index.html` | La estructura y la semántica están mezcladas con el prototipo visual. |
| Lógica | `demo/app.js`, 345 líneas | Estado, carga de datos, temporizador, selección, render y modales viven en el mismo módulo. |
| Estilos | `demo/styles.css`, 177 líneas | La dirección visual es válida y reutilizable, pero no hay tokens ni componentes separados. |
| Datos | `demo/data/question-bank.json`, aproximadamente 1,4 MB | Se carga el banco completo con `fetch` la primera vez que se inicia una partida. |
| Contenido | 4 packs de 520 preguntas, 2.080 preguntas únicas | La generación y validación están separadas en scripts Node y deben conservarse. |
| Persistencia | `localStorage` | Adecuado para historial pequeño; necesita una capa tipada y migraciones versionadas. |
| Runtime de red | No consulta APIs durante la partida | Buena decisión para offline-first; hay que convertirla en offline verificable, no solo en una intención. |
| Build | No hay `package.json`, bundler ni TypeScript | No existe type-checking, árbol de módulos, optimización de producción ni pipeline de tests de frontend. |
| Publicación | GitHub Actions copia `./demo` directamente a Pages | Es sencillo y gratuito, pero no ejecuta build, type-check ni pruebas antes de publicar. |
| Mobile | No hay proyecto Flutter/Capacitor nativo | Todavía no existe empaquetado instalable ni una comprobación de WebView. |

### 2.2 Buenas decisiones que no se deben perder

- El banco se genera y valida offline a partir de una caché de PokéAPI.
- El juego no depende de PokéAPI durante una partida.
- La aplicación usa una clave de historial y evita seleccionar preguntas consumidas.
- Las reglas del rosco están explícitas: 18 preguntas `starts_with` y 8 `contains` por partida.
- Las cuatro dificultades tienen bancos separados.
- La interfaz ya incluye foco visible, `aria-live`, estados textuales, `prefers-reduced-motion` y un panel no invasivo de créditos.
- El fondo y los sprites son locales, lo cual evita depender de una CDN durante el juego.

### 2.3 Problemas estructurales encontrados

1. **Estado global implícito.** El objeto `state` se puede modificar desde muchas funciones y no existe una transición tipada de acciones.
2. **DOM imperativo distribuido.** `querySelector`, `innerHTML`, creación de botones y actualización de clases se mezclan con las reglas del juego.
3. **Carga de datos demasiado amplia.** Se descarga y parsea el banco completo aunque la partida solo necesita una dificultad.
4. **Temporizador de alta frecuencia.** `setInterval` se ejecuta cada 250 ms aunque la pantalla muestra segundos; conviene aislar el reloj para que no fuerce renderizados innecesarios.
5. **Pruebas de frontend inexistentes.** Hay validadores y simuladores de contenido, pero no tests de reducer, selección, temporizador, modales o teclado.
6. **Offline incompleto para una recarga.** Los assets son locales, pero no hay manifiesto PWA ni service worker que garanticen una segunda carga sin red en el navegador.
7. **Rutas y base de publicación no formalizadas.** GitHub Pages usa una URL de proyecto (`/Roscodex/`), por lo que una futura build debe configurar correctamente `base` y todas las rutas de assets.
8. **Compatibilidad móvil no comprobada.** En el entorno auditado no están instalados Flutter ni `adb`; tampoco hay una build nativa para validar Android.
9. **Dependencia visual de recursos sensibles.** Los sprites, los sonidos futuros y cualquier recurso de SpriteCollab necesitan un registro de licencia y atribución antes de incorporarse al paquete.

## 3. Comparativa de alternativas

### 3.1 Mantener JavaScript estático y añadir Vite

**Ventajas:** migración pequeña, bundle optimizado, posibilidad de usar Capacitor, muy poco coste técnico inicial.  
**Inconvenientes:** seguiría faltando una frontera clara entre dominio, estado y presentación; los errores de contrato del banco no se detectarían en compilación.

**Conclusión:** buena etapa intermedia, pero no el destino recomendado.

### 3.2 TypeScript + Vite + React + PWA + Capacitor — recomendada

**Ventajas:**

- TypeScript formaliza `Question`, `QuestionPack`, `Difficulty`, `RoscoStatus`, acciones y resultados.
- React separa `HomeScreen`, `GameScreen`, `Rosco`, `QuestionCard`, `Timer`, modales y resultados.
- Vite genera una build estática optimizada y compatible con GitHub Pages usando `dist`.
- La misma build web se puede servir como PWA y copiar a un proyecto Capacitor.
- Se puede conservar casi todo el lenguaje visual CSS: tipografía, scanlines, fichas, colores, animaciones y responsive.
- No obliga a contratar backend, base de datos ni servicio de preguntas.

**Inconvenientes:**

- Añade dependencias de desarrollo y una cadena de build.
- React no mejora por sí solo el rendimiento; hay que evitar renders globales del temporizador y dividir los datos.
- Capacitor no elimina los requisitos de Android Studio/JDK ni de Xcode/macOS para iOS.
- La publicación en tiendas no es coste cero: se puede distribuir una PWA y un APK firmado por fuera de la tienda, pero las cuentas de las tiendas tienen sus propias condiciones.

**Conclusión:** mejor equilibrio para el objetivo web + móvil sin perder la estética actual.

### 3.3 Flutter + Dart

**Ventajas:** una UI propia para Android, iOS y web, buen rendimiento y tipado fuerte.  
**Inconvenientes:** exige reimplementar la pantalla y el lenguaje visual; la demo ya validada en HTML/CSS no se reutiliza directamente; el SDK no está instalado en el entorno auditado; la web estática de Flutter suele producir más código inicial y no aporta valor específico para un juego que ya es web-first.

**Conclusión:** opción válida si el producto se convierte en una aplicación nativa como prioridad principal. No es la migración de menor riesgo para Roscodex.

### 3.4 React Native/Expo

**Ventajas:** buen ecosistema móvil y TypeScript.  
**Inconvenientes:** la superficie web no comparte de forma directa el DOM/CSS actual; habría que resolver diferencias entre web y plataformas nativas, y GitHub Pages dejaría de ser el camino natural de publicación.

**Conclusión:** no aporta una ventaja suficiente frente a React web + Capacitor.

### 3.5 PWA con TypeScript sin React

**Ventajas:** menor runtime, bundle pequeño y máxima cercanía al DOM.  
**Inconvenientes:** mantiene parte del problema actual de estado y composición si no se introduce una arquitectura disciplinada; el beneficio de peso sería pequeño comparado con el banco y los sprites.

**Conclusión:** alternativa razonable si se quiere minimizar dependencias, pero React facilita más la división por pantallas y las pruebas de interacción.

## 4. Arquitectura objetivo

```text
                    ┌────────────────────────────┐
                    │  Web / PWA en GitHub Pages │
                    └──────────────┬─────────────┘
                                   │ misma build
                    ┌──────────────▼─────────────┐
                    │    App React + TypeScript  │
                    │  UI pixel + reducer juego  │
                    └──────┬───────────┬─────────┘
                           │           │
             ┌─────────────▼───┐ ┌────▼────────────────┐
             │ Dominio puro     │ │ Adaptadores locales  │
             │ reglas/selección │ │ JSON / storage/audio │
             └─────────────┬───┘ └────┬────────────────┘
                           │           │
                    ┌──────▼───────────▼──────┐
                    │ Assets versionados       │
                    │ preguntas, fuentes,      │
                    │ sprites, fuente pixel    │
                    └──────────┬───────────────┘
                               │ build
                    ┌──────────▼───────────────┐
                    │ Capacitor opcional        │
                    │ Android / iOS WebView     │
                    └──────────────────────────┘
```

### 4.1 Estructura propuesta

No se debe crear todavía como parte de esta auditoría; es el destino de la fase de implementación.

```text
src/
  app/
    App.tsx
    app.css
    routes.ts
  domain/
    question.ts
    difficulty.ts
    game-state.ts
    game-reducer.ts
    game-selection.ts
    game-rules.ts
  features/
    home/HomeScreen.tsx
    game/GameScreen.tsx
    game/Rosco.tsx
    game/QuestionCard.tsx
    game/Timer.tsx
    results/ResultsModal.tsx
    credits/CreditsModal.tsx
  infrastructure/
    questions/question-repository.ts
    persistence/history-storage.ts
    audio/audio-service.ts
    pwa/register-service-worker.ts
  ui/
    tokens.css
    pixel-theme.css
    accessibility.css
  main.tsx
public/
  assets/
    fonts/
    sprites/
    audio/
data/
  packs/
scripts/
  build-question-bank.mjs
  validate-content.mjs
  simulate-games.mjs
tests/
  domain/
  components/
  e2e/
```

La lógica de `domain/` debe ser independiente de React y del navegador. Eso permitirá comprobar las reglas con Node/Vitest y evitar que una modificación visual cambie accidentalmente la selección de preguntas.

### 4.2 Estado de la partida

Usar un `useReducer` tipado o un reducer de dominio con acciones explícitas:

```text
START_GAME
ANSWER
PASS
TICK
MOVE_TO_NEXT
START_SECOND_ROUND
FINISH_GAME
RESET_GAME
```

El estado debe incluir solo datos serializables:

- dificultad y tiempo restante;
- preguntas seleccionadas del rosco;
- cola actual y letras aplazadas;
- estado de cada letra;
- puntuación y contadores;
- fase de la partida.

Los efectos externos deben quedar fuera del reducer:

- cargar un pack;
- persistir el historial;
- reproducir un sonido;
- registrar un service worker;
- integrar una API de Capacitor.

Esto hace que una partida pueda probarse sin navegador y evita carreras entre el temporizador y una respuesta.

### 4.3 Banco de preguntas

La fuente de verdad debe seguir siendo `scripts/build-question-bank.mjs`, no la UI. Propongo:

1. Mantener una salida global para validación editorial.
2. Generar cuatro archivos de pack, uno por dificultad, o un manifiesto más cuatro chunks estáticos.
3. Cargar únicamente la dificultad elegida.
4. Precargar el pack seleccionado en PWA y en el bundle de Capacitor.
5. Mantener la clave de historial versionada y una migración de `v4` a la próxima versión si cambia el esquema.
6. Indexar por letra durante la carga para no filtrar las 520 preguntas en cada partida.
7. Persistir solo IDs usados por dificultad; no guardar el banco entero en `localStorage`.

La segmentación no debe cambiar las reglas: cada rosco debe continuar teniendo 26 preguntas, 18 `starts_with`, 8 `contains`, dificultad correcta y ningún ID repetido.

### 4.4 Offline-first real

La aplicación debe distinguir tres estados:

- **Primera visita:** necesita descargar la build desde Pages y registrar el service worker.
- **Visita posterior en navegador:** app shell, fuentes, sprites y packs disponibles desde caché.
- **Capacitor:** los assets forman parte de la aplicación instalada y no dependen de red.

Recomendaciones:

- Añadir un manifiesto PWA y un service worker con precache versionado.
- Cachear el shell, la fuente pixel, sprites y los cuatro packs si el tamaño sigue siendo razonable; como optimización inicial, cachear el pack elegido y ofrecer una precarga voluntaria.
- Mostrar un estado de actualización cuando exista una build nueva.
- No consultar PokéAPI, SpriteCollab ni bancos externos durante la partida.
- Probar una recarga con DevTools en modo Offline y un segundo arranque sin red.

No se debe introducir una base de datos remota ni login para resolver el historial local.

### 4.5 Audio de 8/16 bits

El audio debe ser opcional, corto y local. La opción arquitectónica preferida es sintetizar tonos simples con Web Audio API (onda cuadrada/triangular, duración y envolvente pequeñas) para:

- selección de respuesta;
- acierto;
- error;
- Pasapalabra;
- cuenta atrás;
- fin de partida.

Ventajas: no se distribuye música de Pokémon, no se añade una dependencia de red y el tamaño es mínimo. El servicio debe crearse después de la primera interacción del usuario, respetar `prefers-reduced-motion` y ofrecer un control de sonido.

Si se incorporan archivos externos, cada uno debe tener licencia CC0, dominio público o una licencia compatible documentada. No se debe usar audio extraído de juegos o series oficiales.

### 4.6 Sprites e iconos de SpriteCollab

SpriteCollab puede servir como fuente de inspiración o de recursos, pero no debe tratarse como un paquete de assets de licencia única. Antes de incluir un sprite se necesita:

- identificar el autor o autores;
- leer la licencia concreta del recurso;
- comprobar si permite redistribución en una demo pública;
- guardar atribución y URL en un registro de assets;
- evitar cualquier asset que no tenga permiso claro.

La referencia debe quedar separada de la lógica. La aplicación debe poder funcionar con sprites propios, placeholders o el conjunto ya cacheado aunque un recurso externo se retire.

## 5. Rendimiento y eficiencia

### 5.1 Medidas de mayor impacto

| Prioridad | Acción | Beneficio esperado |
|---|---|---|
| P0 | Cargar solo el pack de dificultad elegido | Menos parseo y menor espera inicial. |
| P0 | Reducir el reloj a una actualización visual por segundo y aislarlo | Menos trabajo de render durante la partida. |
| P0 | Mantener un reducer puro para el dominio | Menos estados imposibles y menos efectos duplicados. |
| P1 | Build Vite con assets versionados y compresión del servidor | Descargas cacheables y más pequeñas. |
| P1 | Lazy-load del fondo decorativo y sprites no esenciales | El rosco y la pregunta aparecen antes. |
| P1 | Preload solo de la fuente y del asset crítico | Mejora del primer render sin sobrecargar la red. |
| P1 | CSS `contain`, transformaciones y animaciones cortas | Menos trabajo de composición en móviles modestos. |
| P2 | Comprimir o convertir sprites manteniendo pixel-perfect | Menor peso sin cambiar la identidad visual. |
| P2 | Medir con Lighthouse y emulación móvil | Evita optimizar por intuición. |

### 5.2 Decisiones que evitaría

- No usar canvas para el rosco: 26 nodos DOM son fáciles de hacer accesibles y no son un cuello de botella.
- No introducir Redux, un backend o una base de datos remota en el MVP.
- No consultar una API para generar preguntas durante la partida.
- No instalar un framework SSR como Next.js: no hay servidor ni necesidad de SEO dinámico para el juego, y GitHub Pages encaja mejor con una build estática de Vite.
- No añadir un sistema de componentes visuales generalista que cambie los estilos pixel-art o aumente el bundle sin necesidad.

## 6. Compatibilidad web, GitHub Pages y móvil

### 6.1 GitHub Pages

La futura workflow debe pasar de copiar `./demo` a:

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
upload ./dist
```

Para el repositorio `BertMarti/Roscodex`, Vite debe usar `base: "/Roscodex/"` o una configuración equivalente. Los assets deben construirse con imports o con `import.meta.env.BASE_URL`; no se deben dejar rutas absolutas que funcionen solo en `http://localhost:8080/`.

Como el juego es una única superficie, conviene no introducir rutas SPA con history API en la primera migración. Si en el futuro se necesitan pantallas enlazables, usar hash routing o configurar un `404.html` de fallback.

GitHub Pages seguirá siendo suficiente porque solo necesita servir HTML, CSS, JavaScript, JSON y assets estáticos. La build debe ser reproducible sin secretos ni claves.

### 6.2 PWA

La PWA es la opción móvil de coste cero más directa:

- se instala desde el navegador cuando el navegador lo permite;
- mantiene la estética exactamente;
- comparte la misma build web;
- no requiere cuenta de tienda;
- puede jugar offline después de la primera precarga.

Debe considerarse el producto móvil principal antes de crear binarios nativos.

### 6.3 Capacitor

Capacitor encaja después de estabilizar la build web. La secuencia sería:

```text
npm run build
npx cap sync
npx cap add android
npx cap open android
```

En Android se necesitarán Android Studio, SDK, Gradle/JDK y una prueba en emulador o dispositivo. En iOS se necesitarán macOS y Xcode. El código web debe seguir funcionando fuera de Capacitor; las APIs nativas se encapsulan en adaptadores opcionales.

El alcance de coste cero es realista para:

- GitHub Pages;
- PWA;
- APK de desarrollo o distribución directa;
- almacenamiento local;
- audio generado localmente;
- datos y assets incluidos en el repositorio.

No es realista prometer coste cero para publicar en todas las tiendas: las cuentas, revisiones y requisitos de Apple/Google son externos al código.

## 7. Plan de migración por fases

### Fase 0 — Contrato y congelación

**Objetivo:** evitar que la migración cambie las reglas.

- Congelar el esquema de pregunta y los resultados actuales.
- Convertir las reglas de validación existentes en criterios de regresión.
- Documentar el comportamiento visual de inicio, partida, Pasapalabra, segunda vuelta y resultado.
- Guardar capturas de referencia en móvil estrecho y escritorio.

**Salida:** contrato de dominio y matriz de paridad.

### Fase 1 — Bootstrap de TypeScript/Vite

**Objetivo:** tener una build equivalente sin cambiar la experiencia.

- Crear `package.json`, `tsconfig` estricto y configuración Vite.
- Fijar versiones en `package-lock.json`.
- Añadir scripts `dev`, `build`, `preview`, `typecheck`, `test` y `content:check`.
- Configurar `base: "/Roscodex/"`.
- Mantener la demo anterior temporalmente como referencia, sin borrarla hasta la fase de corte.

**Salida:** una build estática que carga en local y bajo `/Roscodex/`.

### Fase 2 — Extraer dominio y datos

**Objetivo:** que las reglas de la partida no dependan de React.

- Definir tipos TypeScript para packs, preguntas, opciones, historial y estados.
- Extraer selección sin repetición, distribución 70/30 y transición de rondas.
- Crear un repositorio local de preguntas con carga por dificultad.
- Mantener los scripts Node actuales como generadores y validadores.
- Añadir migración de historial y manejo de banco agotado.

**Salida:** tests unitarios de dominio pasando sin navegador.

### Fase 3 — Rehacer la UI por componentes

**Objetivo:** reproducir la pantalla existente con una arquitectura mantenible.

- `HomeScreen`: marca Roscodex, dificultad, créditos.
- `GameScreen`: cabecera, temporizador, rosco, leyenda y tarjeta.
- `Rosco`: posiciones circulares, mini-Pokéball de fondo y letra plana.
- `QuestionCard`: respuestas, feedback y Pasapalabra.
- `ResultsModal` y `CreditsModal`.
- Migrar primero el CSS existente; refactorizar tokens después de alcanzar paridad.

**Salida:** paridad funcional y visual en viewport móvil y escritorio.

### Fase 4 — PWA y optimización

**Objetivo:** que la aplicación sea instalable y recuperable sin red.

- Añadir manifest y service worker.
- Precachear shell y assets requeridos.
- Separar packs y cargar solo la dificultad activa.
- Añadir control de audio, Web Audio local y preferencias.
- Medir arranque, memoria y rendimiento con throttling móvil.

**Salida:** segundo arranque offline reproducible.

### Fase 5 — Capacitor Android

**Objetivo:** generar una app móvil reutilizando la build web.

- Añadir Capacitor como dependencia de producción solo cuando haga falta.
- Configurar `webDir: "dist"`.
- Incorporar plataforma Android y probar navegación, pausa/reanudación, audio y almacenamiento.
- Mantener los plugins al mínimo: Preferences si `localStorage` resulta insuficiente y Haptics solo como mejora opcional.
- No añadir notificaciones, analítica ni red en el MVP.

**Salida:** APK debug instalable y partida completa offline.

### Fase 6 — Cierre y publicación

**Objetivo:** reemplazar la demo antigua sin perder la URL.

- Actualizar workflow para instalar, validar y construir.
- Publicar `dist` en GitHub Pages.
- Comparar la URL pública bajo `/Roscodex/`.
- Mantener un rollback al commit de la demo anterior hasta superar el periodo de prueba.
- Marcar la carpeta heredada como referencia o eliminarla solo en un commit separado y explícito.

**Salida:** despliegue reproducible, trazable y reversible.

## 8. Riesgos y mitigaciones

| Riesgo | Nivel | Mitigación |
|---|---|---|
| La migración cambia el comportamiento del rosco | Alto | Tests de dominio, simulación de 80 partidas y matriz de paridad antes del corte. |
| `base` incorrecto rompe Pages | Alto | Test de producción con URL `/Roscodex/` y revisión de todos los imports de assets. |
| Service worker sirve una versión antigua | Alto | Cache names versionados, aviso de actualización y prueba de limpieza/recarga. |
| React provoca renderizados excesivos | Medio | Reducer puro, componentes pequeños, timer aislado y medición con profiling. |
| El banco crece demasiado | Medio | Packs separados, carga por dificultad, compresión y precarga controlada. |
| `localStorage` se borra o falla en modo privado | Medio | Adaptador tolerante a errores, historial de sesión como fallback y mensaje transparente. |
| Audio bloqueado por políticas del navegador | Medio | Crear `AudioContext` tras el primer gesto y continuar jugando aunque el audio no esté disponible. |
| Capacitor introduce divergencias con la web | Medio | Probar primero la build web, aislar APIs nativas y usar fallbacks web. |
| Los assets de SpriteCollab no permiten redistribución | Alto | Registro de licencia por recurso, atribución y fallback de sprites propios/placeholders. |
| La publicación móvil no es realmente gratuita | Alto | Tratar PWA y GitHub Pages como producto principal; considerar APK directo como opcional. |
| Dependencias abandonadas o vulnerables | Medio | `npm audit` en CI, lockfile, actualizaciones periódicas y pocas dependencias. |
| Se intenta portar antes de cerrar contenido | Medio | Mantener el generador, validador, simulador y revisión editorial como gates. |

## 9. Calidad, accesibilidad y pruebas

### Gates mínimos de CI

```text
npm ci
npm run typecheck
npm run test
npm run content:check
npm run build
```

El pipeline debe fallar si hay errores de TypeScript, preguntas repetidas, distribución incorrecta o build rota.

### Tests de dominio

- selección de una pregunta por letra;
- 18 `starts_with` y 8 `contains`;
- no repetir IDs entre partidas hasta agotar el pack;
- agotamiento por dificultad;
- `Pasapalabra` en primera y segunda vuelta;
- respuesta correcta, incorrecta y tiempo agotado;
- puntuación y contadores;
- migración de historial anterior;
- preguntas de Principiante sin campos técnicos prohibidos.

### Tests de interacción

- iniciar cada dificultad;
- responder con teclado y táctil;
- foco visible y foco devuelto al cerrar modales;
- lectura de pregunta, regla, estado de letra y feedback con lector de pantalla;
- mensajes que no dependan exclusivamente del color;
- viewport de 320 px, 390 px, tablet y escritorio;
- `prefers-reduced-motion`;
- recarga offline después de precache;
- pausa/reanudación de la app en Capacitor.

### Criterios de rendimiento

- no descargar APIs durante una partida;
- no bloquear el primer render con sprites decorativos no críticos;
- actualizar el temporizador visual una vez por segundo;
- mantener la animación del rosco basada en CSS y transformaciones;
- medir el tamaño de `dist` y documentar cualquier crecimiento significativo;
- comprobar una partida completa en un móvil de gama baja emulado.

## 10. Criterios de aceptación de la modernización

La migración puede considerarse aceptada cuando se cumpla todo lo siguiente:

1. `npm ci`, `npm run typecheck`, `npm run test`, `npm run content:check` y `npm run build` pasan en limpio.
2. GitHub Pages sirve la aplicación bajo `https://bertmarti.github.io/Roscodex/` sin errores de rutas ni recursos 404.
3. La UI conserva la identidad Roscodex: fondo oscuro pixel-art, rosco circular, letras planas con Pokéball semitransparente, tarjeta de pregunta y cuatro respuestas.
4. Las cuatro dificultades conservan sus tiempos, contenido y reglas de dificultad.
5. El reparto de preguntas sigue siendo 70/30 aproximado, con 18 `starts_with` y 8 `contains` por rosco.
6. Las preguntas no se repiten hasta agotar la dificultad y el comportamiento de agotamiento sigue siendo explícito.
7. Una segunda carga sin red funciona en la PWA tras completar la precarga inicial.
8. El juego funciona con audio desactivado, con movimiento reducido y mediante teclado.
9. La build de Capacitor puede abrir la partida offline en Android sin modificar las reglas del dominio.
10. No hay claves secretas, backend obligatorio, telemetría obligatoria ni servicio de pago en runtime.
11. Cada sprite, icono y sonido incorporado tiene licencia y atribución registradas.
12. La aplicación antigua permanece disponible como rollback hasta validar la primera publicación moderna.

## 11. Conclusión

La demo no necesita una reescritura nativa para ser más eficiente. Necesita una frontera clara entre reglas, datos, persistencia y UI, más una build capaz de dividir y precachear recursos. TypeScript + Vite + React resuelve el problema de mantenimiento con un coste de migración asumible; PWA resuelve el acceso móvil gratuito; Capacitor añade una salida Android/iOS cuando el producto lo necesite.

Flutter sigue siendo una alternativa técnica válida, pero en este momento sería una reimplementación completa con un coste de validación visual mayor y sin SDK instalado en el entorno auditado. La decisión recomendada es modernizar primero la base web y conservar la opción de cambiar de capa móvil más adelante porque el dominio quedará desacoplado.

## 12. Fuentes técnicas consultadas

- [Vite — despliegue de sitios estáticos y GitHub Pages](https://vite.dev/guide/static-deploy)
- [Vite — build de producción](https://vite.dev/guide/build)
- [React — uso de TypeScript](https://react.dev/learn/typescript)
- [React — instalación y aplicaciones desde cero](https://react.dev/learn/installation)
- [Capacitor — runtime multiplataforma para aplicaciones web](https://capacitorjs.com/docs)
- [GitHub Pages — documentación oficial](https://docs.github.com/en/pages)
- [SpriteCollab — repositorio de referencia de sprites](https://github.com/PMDCollab/SpriteCollab)

## 13. Verificaciones realizadas durante la auditoría

- `node --check demo/app.js` — correcto.
- `node demo/validate-content.mjs` — correcto: 4 packs, 2.080 preguntas únicas y mínimo 20 por letra.
- `node scripts/simulate-games.mjs` — correcto: 80 partidas simuladas, 2.080 preguntas consumidas sin repetición.
- Node disponible en el entorno: `v24.19.0`.
- npm disponible en el entorno: `11.17.0`.
- Flutter no está instalado en el entorno auditado.
- `adb` no está disponible en el entorno auditado.
- No se modificaron archivos de aplicación, datos, scripts, workflow ni configuración del repositorio.
