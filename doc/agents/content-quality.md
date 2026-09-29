# Agente de calidad de contenido

## Finalidad

Auditar y mejorar la calidad del banco de preguntas de Roscodex: coherencia real entre dificultades, variedad, ausencia de repeticiones, trazabilidad de fuentes y validación automática. Este documento sirve como contexto operativo para el agente responsable del contenido y como contrato editorial para futuras ampliaciones.

## Alcance de esta auditoría

Archivos revisados el 29 de septiembre de 2026:

- `demo/data/question-bank.json` y la copia de runtime `public/data/question-bank.json`
- `scripts/build-question-bank.mjs`
- `scripts/validate-content.mjs` y `demo/validate-content.mjs`
- `scripts/simulate-games.mjs`

El encargo era auditar, no corregir. No se han editado datos ni scripts.

### Rutas de validación y migración de runtime

Al comienzo de esta auditoría solo estaba presente `demo/validate-content.mjs`. Durante la modernización paralela apareció `scripts/validate-content.mjs`, que contiene una copia equivalente apuntando a `public/data/`. Ahora existen dos validadores con lógica duplicada y dos posibles ubicaciones del banco. Debe elegirse una única implementación canónica, o extraerse un módulo compartido con una ruta de datos configurable; mantener dos copias acabará produciendo resultados divergentes.

El generador y el simulador también han sido redirigidos en el árbol de trabajo actual desde `demo/data/` hacia `public/data/`. Este informe conserva la auditoría del banco original y recomienda comparar hashes/contenido de ambas copias antes de publicar. La migración de ruta no debe mezclarse con cambios de contenido sin dejar un manifest reproducible.

## Resultado ejecutivo

El banco cumple los invariantes básicos y los scripts terminan correctamente, pero todavía no cumple una interpretación fuerte de “preguntas que no se repitan jamás”. La deduplicación actual es textual; no evita repetir respuesta, especie, conjunto de datos ni estructura de pregunta.

| Comprobación | Resultado actual | Evaluación |
| --- | ---: | --- |
| Packs | 4 | Correcto |
| Preguntas por dificultad | 520 | Correcto como mínimo actual |
| Preguntas totales | 2.080 | Correcto |
| Preguntas por letra y pack | 20 | Correcto en cantidad |
| `starts_with` por pack | 360 | Correcto: 69,2 % |
| `contains` por pack | 160 | Correcto: 30,8 % |
| IDs únicos | 2.080/2.080 | Correcto |
| Enunciados exactos únicos | 2.080/2.080 | Correcto |
| Prefijos permitidos | 2 | Correcto |
| Principiante con términos prohibidos | 0 detectados | Correcto según blacklist actual |
| Fuente declarada | PokéAPI en todas | Correcto, pendiente de revisión editorial |
| Simulación | 20 roscos por dificultad | Correcta, pero limitada |

### Hallazgos prioritarios

1. **Los cuatro niveles usan el mismo recorrido de respuestas.** `chooseTargets()` solo depende de Pokémon, letra y regla. Como el generador recorre siempre las mismas letras y variantes, las 520 respuestas correctas coinciden posición por posición en principiante, normal, difícil y extremo. También coinciden los 520 conjuntos de opciones. Esto reduce mucho la variedad entre partidas y hace que la dificultad dependa casi exclusivamente del texto de la pista.

2. **Hay repetición de especie dentro de una misma letra.** `chooseTargets()` devuelve `eligible[(index * 7 + index * index) % eligible.length]`. Si una letra tiene menos de 20 candidatos, el módulo reutiliza candidatos. Ejemplos de respuestas únicas por letra, sobre 20 preguntas: `X=2`, `Y=2`, `Q=4`, `J=4`, `Z=4`, `E=7`, `H=9`. Los IDs y enunciados son distintos, pero la experiencia del jugador vuelve a mostrar la misma especie.

3. **La dificultad normal es demasiado técnica para ser un nivel intermedio.** De sus 520 preguntas, 494 contienen datos numéricos o técnicos según la auditoría: altura, peso, experiencia base, habilidades, movimientos o estadísticas. Además, difícil y extremo comparten prácticamente las mismas fuentes y el mismo tipo de hechos.

4. **Difícil y extremo no tienen una frontera suficientemente medible.** Ambos usan `types`, `generation`, `height`, `weight`, `stats`, `base_experience`, `abilities` y `moves`. Extremo combina más datos en algunas plantillas, pero no existe una puntuación, una matriz de competencias ni un control que garantice que cada pregunta de extremo sea más exigente que una normal o difícil.

5. **El 70/30 está fijado por letra, no mezclado por partida.** `CONTAINS_LETTERS` asigna siempre `C, F, I, L, O, R, U, W` a `contains`. Por tanto, cada rosco repite el mismo mapa de reglas y la misma secuencia de 18/8. La proporción es correcta, pero no está desordenada entre las letras A-Z.

6. **La desambiguación añade texto genérico en vez de aportar contenido.** `questionDisambiguators` evita algunos duplicados exactos con frases como “según los datos registrados”, pero no crea una pregunta nueva desde el punto de vista del jugador. La unicidad semántica debe basarse en hechos y respuestas, no en coletillas.

## Auditoría por archivo

### `demo/data/question-bank.json`

#### Lo que funciona

- El formato es legible y autocontenido para una aplicación offline.
- Cada registro tiene `id`, `letter`, `rule`, `question`, `options`, `correctOptionId`, `category`, `difficulty`, `explanation` y `source`.
- Hay exactamente cuatro opciones por pregunta.
- Los prefijos son `Empieza por la letra X.` o `Contiene la letra X.`.
- La respuesta correcta cumple la regla declarada.
- La fuente contiene proveedor, endpoint, campos, fecha y estado.

#### Riesgos actuales

- La misma especie y los mismos distractores se reutilizan en los cuatro packs en la misma posición.
- El banco declara 20 preguntas por letra, pero no declara cuántas respuestas distintas hay por letra ni si se permite reutilizar especie.
- `source.fields` contiene todos los campos disponibles para la dificultad, no necesariamente los campos realmente usados en ese enunciado. Esto dificulta auditar si una pregunta está respaldada por el dato que menciona.
- `reviewedAt` es la fecha de generación, mientras que `status: generated-validated` no demuestra revisión humana. Conviene separar generación, validación automática y aprobación editorial.
- Los movimientos y habilidades aparecen con nombres ingleses de PokéAPI. Puede ser aceptable para un nivel alto, pero debe ser una decisión explícita de idioma y dificultad.
- El esquema no incluye `templateId`, `factIds`, `semanticFingerprint`, `answerId` ni un score de dificultad; por ello, los validadores no pueden detectar repeticiones conceptuales ni comparar niveles de forma robusta.

### `scripts/build-question-bank.mjs`

#### Lo que funciona

- PokéAPI se usa como fuente estructurada y el catálogo se cachea localmente.
- La partida no depende de una consulta de red en tiempo de ejecución.
- La salida se genera de forma determinista para un mismo cache, aunque la fecha global cambia en cada ejecución.
- Se intenta conservar 20 variantes por letra y dificultad, y se controla que haya tres distractores únicos.
- La generación tiene reintentos HTTP y concurrencia limitada.

#### Problemas de diseño

- `sourceFieldsByDifficulty` aumenta la cantidad de datos disponibles, pero no modela una progresión pedagógica.
- `buildClue()` selecciona plantillas por posición; no selecciona un conjunto de hechos previamente clasificado y validado.
- `chooseTargets()` no tiene una política de no reutilización. El módulo fuerza duplicados cuando hay pocos candidatos.
- El objetivo se selecciona igual en todas las dificultades; no hay semilla por pack, dificultad o temporada.
- `CONTAINS_LETTERS` hace que la regla quede atada a ocho letras. No existe una fase de asignación de reglas con cuota 70/30 y aleatorización reproducible.
- Se generan preguntas a partir de datos de especie, pero no se genera un informe de cobertura: candidatos disponibles por letra, candidatos únicos, hechos disponibles, plantillas descartadas y motivos de descarte.
- `questionDisambiguators` puede hacer pasar una comprobación textual sin aumentar la calidad real.
- El generador depende de una caché que solo valida cantidad mínima. No valida versión, hash, fecha, forma de cada registro ni compatibilidad del catálogo.
- `version: 1` identifica el banco, pero no existe una versión de esquema ni manifest que permita reproducir una edición editorial concreta.
- `REVIEWED_AT` es una fecha de ejecución, no una fecha de revisión de cada pregunta.

### `scripts/validate-content.mjs` y `demo/validate-content.mjs`

#### Comprobaciones valiosas

Ambas versiones contienen prácticamente la misma lógica: la variante de `scripts/` lee `public/data/` y la de `demo/` lee `demo/data/`. La duplicación de código y de ruta es ahora el riesgo principal de mantenimiento.

- Comprueba IDs y enunciados duplicados globalmente.
- Comprueba la dificultad del pack, la letra, la regla y los prefijos.
- Comprueba cuatro opciones, IDs de opción únicos y textos de opción no repetidos.
- Comprueba la relación entre respuesta correcta y letra.
- Aplica la restricción de principiante y rechaza etiquetas de pista antiguas.
- Comprueba 500 preguntas mínimas, 20 por letra y la distribución 360/160.

#### Gaps de validación

- Solo detecta duplicados exactos; no detecta la misma respuesta, la misma combinación de hechos, la misma plantilla ni las mismas opciones entre dificultades.
- No valida tipos de datos del esquema antes de acceder a sus propiedades. Un registro incompleto podría generar un error poco explicativo o no comprobarse correctamente.
- No valida `questionCount`, `bank.version`, `questionsPerDifficulty` ni `questionsPerLetter` contra el contenido real.
- No valida que `correctOptionId` sea exactamente uno de los IDs permitidos ni que cada opción tenga `id` y `text` no vacíos.
- No valida `category`, `explanation`, el formato de `reviewedAt`, el dominio del endpoint ni la correspondencia entre `source.fields` y los hechos utilizados.
- La blacklist de principiante es útil como red de seguridad, pero no puede medir que una pregunta sea sencilla. También debe existir una clasificación editorial positiva.
- La distribución 360/160 está hardcodeada. Al ampliar el banco o cambiar la política 70/30 habrá que editar el validador manualmente.
- El mensaje de éxito dice “sin duplicados globales”, aunque esto significa sin duplicados textuales, no sin repetición de contenido.

### `scripts/simulate-games.mjs`

#### Lo que funciona

- Simula 20 roscos completos por pack.
- Garantiza una pregunta por letra, 26 IDs distintos por rosco y 18/8 reglas.
- Comprueba que la reserva termina consumiendo 520 IDs sin repetición dentro de cada dificultad.

#### Limitaciones

- No llama al mismo selector que usa la aplicación; implementa su propia selección determinista con `(game - 1) % candidates.length`.
- En el árbol de trabajo actual lee `public/data/question-bank.json`; la versión anterior leía `demo/data/question-bank.json`. Debe existir una sola fuente de runtime y una comprobación de paridad si se conserva una copia de transición.
- No usa semillas, no simula varios órdenes de letras ni prueba la aleatoriedad reproducible.
- No verifica historial persistente entre sesiones, mezcla entre packs ni agotamiento real del banco en una partida adicional.
- No detecta que las cuatro dificultades usan las mismas respuestas y distractores.
- No comprueba calidad de distractores, proporción de especies únicas, variedad de plantillas ni repetición semántica.
- La expectativa rígida de 18 `starts_with` y 8 `contains` dejará de ser adecuada si la regla se asigna aleatoriamente por rosco; deberá pasar a validar la cuota y la semilla.

## Modelo de dificultad recomendado

La dificultad debe describir qué tiene que razonar el jugador, no solo qué campos conoce el generador.

| Nivel | Hechos recomendados | Evitar | Criterio editorial |
| --- | --- | --- | --- |
| Principiante | Un hecho directo de tipo o generación; especies conocidas y nombres claros | Peso, altura, número de Pokédex, experiencia, estadísticas, habilidades, movimientos, cálculos y combinaciones largas | Se puede resolver con conocimiento general o una asociación sencilla |
| Normal | Uno o dos hechos sencillos: tipos, generación, evolución, color, hábitat o categoría de especie | Cadenas de tres números y movimientos/habilidades en inglés como única vía | Exige recordar un dato concreto, pero no calcular ni cruzar muchos datos |
| Difícil | Dos hechos combinados; habilidad, movimiento, evolución o una estadística concreta | Enunciados ambiguos y combinaciones que solo se distinguen por un decimal | Requiere conocimiento de juego o contrastar dos datos |
| Extremo | Dos o tres hechos específicos, formas, habilidades/movimientos menos comunes, valores exactos o condiciones combinadas | Preguntas cuya solución dependa de un dato erróneo, idioma inconsistente o una pista interpretativa | Solo jugadores expertos deberían reconocer la respuesta con seguridad |

Esta matriz requiere ampliar el catálogo más allá del endpoint básico de Pokémon cuando se incorporen color, hábitat, cadena evolutiva o categoría. La ampliación debe estar respaldada por fuente y no introducir datos no verificados.

### Score de dificultad propuesto

Para poder validar automáticamente la progresión, cada candidato debería calcular un score antes de ser publicado:

- `1`: un hecho directo de tipos o generación.
- `2`: dos hechos sencillos o un hecho menos frecuente.
- `3`: habilidad, movimiento, evolución o combinación de dos hechos.
- `4`: tres hechos, estadística exacta, forma o dato de baja frecuencia.
- `5`: combinación experta que requiere dominio específico y que ha sido revisada manualmente.

El pack debe declarar un rango permitido y el validador debe rechazar candidatos fuera de él. El score es un control, no sustituye la revisión humana.

## Esquema de contenido recomendado

La migración debería ser compatible hacia atrás: conservar `question` y `options` durante una primera etapa, y añadir metadatos nuevos. En una futura versión de esquema, cada pregunta debería parecerse a esto:

```json
{
  "id": "normal-a-8f3c1d",
  "letter": "A",
  "rule": "starts_with",
  "question": "Empieza por la letra A. Es de tipo Agua y Hada.",
  "templateId": "type-single-v2",
  "answer": {
    "id": "azumarill",
    "label": "Azumarill",
    "canonical": "azumarill"
  },
  "options": [
    { "id": "a", "text": "Azumarill", "entityId": "azumarill" },
    { "id": "b", "text": "Arbok", "entityId": "arbok" },
    { "id": "c", "text": "Amaura", "entityId": "amaura" },
    { "id": "d", "text": "Aipom", "entityId": "aipom" }
  ],
  "correctOptionId": "a",
  "facts": [
    { "id": "type:azumarill:water", "kind": "type", "value": "water" },
    { "id": "type:azumarill:fairy", "kind": "type", "value": "fairy" }
  ],
  "difficulty": "normal",
  "difficultyScore": 2,
  "category": "tipos",
  "semanticFingerprint": "normal|starts_with|A|azumarill|type:water+type:fairy",
  "explanation": "Azumarill es de tipo Agua y Hada.",
  "source": {
    "provider": "PokéAPI",
    "endpoint": "https://pokeapi.co/api/v2/pokemon/azumarill",
    "fieldsUsed": ["types"],
    "retrievedAt": "2026-09-29",
    "reviewedAt": null,
    "reviewStatus": "generated"
  }
}
```

Cambios importantes frente al formato actual:

- `answer.id` y `entityId` permiten detectar que se repite una especie aunque cambie el texto.
- `facts` identifica la información que realmente respalda el enunciado.
- `templateId` permite controlar la variedad y la dificultad.
- `semanticFingerprint` permite bloquear la misma pregunta entre packs.
- `fieldsUsed` sustituye a una lista de todos los campos disponibles.
- `reviewStatus` distingue `generated`, `auto-validated`, `editorial-reviewed` y `rejected`.
- `reviewedAt` no debe rellenarse hasta que exista revisión humana.

## Estrategia para ampliar el banco sin repetición

### 1. Separar catálogo, hechos y preguntas

No generar la pregunta directamente desde un objeto Pokémon. Crear tres capas:

1. **Catálogo:** especies, formas, nombres normalizados y datos de PokéAPI.
2. **Hechos:** hechos atómicos verificables, por ejemplo `type:water`, `generation:2`, `ability:static`.
3. **Preguntas:** plantillas que combinan uno o más hechos con una respuesta y distractores.

Esto permite saber si se está ampliando la variedad real o solo reformulando la misma pista.

### 2. Construir un pool grande por dificultad

Generar al menos tres veces el número que se quiere publicar y filtrar después. Para 500 preguntas publicables por dificultad, conviene producir inicialmente entre 1.500 y 2.000 candidatas, porque se descartarán:

- preguntas con hechos insuficientes;
- respuestas repetidas en una letra;
- distractores poco plausibles;
- textos ambiguos;
- candidatos que incumplan el score de dificultad;
- preguntas ya utilizadas en otro pack.

El mínimo de publicación debe configurarse en un archivo de política, no estar duplicado como números mágicos en scripts.

### 3. Reservar contenido globalmente

Mantener un registro global de fingerprints ya publicados. Como mínimo, el fingerprint debe combinar:

```text
regla + letra + respuesta + conjunto ordenado de hechos
```

Para una diversidad más fuerte, añadir una política de objetivo por pack:

- no repetir el mismo `answer.id` en la misma letra dentro de un pack;
- evitar el mismo `answer.id` en packs distintos mientras existan candidatos suficientes;
- no repetir el mismo conjunto de distractores;
- no repetir una plantilla más de un porcentaje configurable por letra;
- no usar coletillas genéricas para fabricar unicidad.

Si no hay candidatos suficientes para Q, X, Y o Z, el generador debe producir un informe de déficit y detener la generación. No debe rellenar silenciosamente con la misma especie.

### 4. Semilla y selección reproducible

Usar una semilla explícita por generación, pack y partida. La semilla debe permitir reproducir un fallo:

```text
seed del banco + difficulty + letter + roscoSeed
```

La aleatoriedad debe ser determinista en generación y en simulación. No depender de `Math.random()` en validaciones.

### 5. Regla 70/30 mezclada

Mantener 18 preguntas `starts_with` y 8 `contains` por rosco, pero asignar las reglas mediante una lista barajada con semilla. La regla no debe estar siempre ligada a las mismas letras.

Antes de publicar, generar un informe de capacidad por letra y regla. Si una letra no tiene candidatos suficientes para ambas reglas, hay tres salidas válidas: ampliar fuentes, cambiar la política editorial de esa letra con una decisión documentada o reducir temporalmente su cuota. Repetir automáticamente no es una salida válida.

Si se mantiene la política actual de que `contains` no puede coincidir también con el inicio, debe quedar documentado y validarse como `contains_non_initial`. Si no es una regla de producto, puede simplificarse a `contains` normal para aumentar la cobertura.

## Validación propuesta

### Nivel de esquema

Validar antes de las reglas de negocio:

- tipos de datos y campos obligatorios;
- IDs con formato estable;
- `letter` dentro de A-Z;
- `rule` dentro de un enum;
- exactamente cuatro opciones con IDs `a`, `b`, `c`, `d`;
- `correctOptionId` válido y único;
- textos no vacíos y sin espacios accidentales;
- `source.endpoint`, `provider`, estado y fechas válidos.

### Nivel de reglas del juego

- Una pregunta por letra y por posición del rosco.
- Respuesta correcta compatible con la regla.
- Cuota 70/30 configurable y, por rosco, 18/8 cuando la política lo exija.
- Cuatro opciones normalizadas y distintas.
- Distractores no vacíos y no equivalentes a la respuesta correcta.
- Historial y selección capaces de consumir el pool sin reusar IDs.

### Nivel de unicidad

Validar cuatro fingerprints, de menor a mayor fuerza:

1. texto normalizado exacto;
2. texto sin prefijo y sin puntuación;
3. `respuesta + hechos + regla + letra`;
4. `respuesta + hechos`, global entre dificultades.

El nivel 4 es el que debe impedir que una pregunta se repita entre packs aunque se reescriba. Si el producto decide permitir el mismo Pokémon con otro hecho distinto, debe quedar explícito y medirse con un límite de reutilización.

### Nivel de dificultad

- Score dentro del rango del pack.
- Ninguna palabra o campo prohibido en principiante.
- Cobertura mínima de categorías por dificultad.
- Límite de preguntas numéricas, habilidades y movimientos en normal.
- Diferencia mínima de score entre normal, difícil y extremo.
- Revisión humana obligatoria para score 4 y 5.

### Nivel editorial

- Enunciado exclusivamente con uno de los dos prefijos permitidos.
- Español natural, sin traducciones automáticas extrañas.
- Nombres oficiales coherentes y tratamiento consistente de guiones, formas y diacríticos.
- Explicación respaldada por los mismos `facts` que generan la pista.
- Fuente consultable y estado de revisión honesto.

El validador debería emitir también un informe JSON con descartes por motivo. Un fallo debe indicar ID, pack, letra, fingerprint, regla incumplida y fuente.

## Simulación recomendada

`simulate-games.mjs` debe probar el selector real o una función compartida por aplicación y simulador. La simulación futura debería:

1. Ejecutar al menos 100 semillas por dificultad en CI y un modo ampliado local.
2. Crear varios roscos consecutivos sin reiniciar el historial.
3. Comprobar que no se repiten IDs, respuestas ni fingerprints según la política elegida.
4. Comprobar que las reglas se mezclan y respetan la cuota.
5. Comparar resultados entre dificultades y verificar que no comparten contenido reservado.
6. Probar el estado de agotamiento sin reutilización silenciosa.
7. Guardar la semilla del fallo para reproducirlo.

La simulación actual es una buena prueba de capacidad mínima, pero no es todavía una prueba de calidad ni de aleatoriedad.

## Flujo editorial recomendado

```text
fuentes -> catálogo cacheado -> hechos atómicos -> candidatas
        -> validación automática -> revisión editorial -> pack publicado
```

Cada candidata debería tener un estado:

- `generated`: creada por el generador.
- `auto-validated`: cumple esquema y reglas mecánicas.
- `editorial-reviewed`: una persona ha revisado claridad, dificultad y respuesta.
- `rejected`: descartada con motivo.

La revisión manual puede empezar por una muestra estratificada: todas las letras raras, todas las preguntas de score alto, todas las novedades entre versiones y una muestra aleatoria del resto. Los rechazos deben conservarse para evitar regenerar la misma candidata en la siguiente ejecución.

## Plan de trabajo priorizado

### P0 — Evitar repeticiones reales

- Separar `answerId`, hechos y fingerprint.
- Dejar de repetir candidatos cuando una letra tiene menos de 20 especies elegibles.
- Generar un informe de déficit por letra/regla.
- Reservar fingerprints globales entre dificultades.
- Resolver primero la duplicidad `demo/data`/`public/data` y `demo/validate`/`scripts/validate`.

### P1 — Corregir la progresión de dificultad

- Introducir templates versionadas y score.
- Reducir la carga técnica de normal.
- Diferenciar hard y extreme mediante hechos y score, no solo mediante frases más largas.
- Mantener principiante limitado a tipos/generación y validar con reglas positivas.

### P1 — Mezclar la regla 70/30

- Desacoplar `contains` de la lista fija de letras.
- Asignar 18/8 por rosco con semilla reproducible.
- Validar capacidad por letra y distribución por pack.

### P2 — Mejorar trazabilidad

- Añadir `templateId`, `facts`, `fieldsUsed`, `semanticFingerprint`, `difficultyScore` y `reviewStatus`.
- Separar `generatedAt`, `retrievedAt` y `reviewedAt`.
- Versionar el esquema y guardar manifest de caché/semilla.

### P2 — Endurecer QA

- Compartir selector entre aplicación y simulador.
- Ejecutar simulación con varias semillas.
- Generar reporte de cobertura, repeticiones, dificultad y descartes en CI.
- Añadir revisión editorial de letras escasas, nombres especiales y preguntas de nivel extremo.

## Criterios de aceptación para la siguiente versión

La siguiente regeneración de contenido debería considerarse correcta solo si:

- mantiene exclusivamente `Empieza por la letra X.` y `Contiene la letra X.`;
- mantiene al menos 500 preguntas por dificultad sin duplicados semánticos publicados;
- no repite el mismo `answer + facts` entre packs, salvo excepciones documentadas;
- no repite una respuesta dentro de la misma letra mientras existan candidatos válidos;
- distribuye las reglas 70/30 de forma reproducible y no fija siempre `contains` en las mismas letras;
- principiante no contiene métricas, IDs, habilidades, movimientos ni estadísticas;
- normal, difícil y extremo tienen rangos y categorías verificables;
- cada pregunta declara los campos realmente usados y su estado de revisión;
- el validador y la simulación prueban la política configurada, no números duplicados en el código;
- se conserva la semilla y el informe para reproducir cualquier fallo.
