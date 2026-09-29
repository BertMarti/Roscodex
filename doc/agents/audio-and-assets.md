# Agente de audio y recursos — auditoría y plan de incorporación

**Proyecto:** Roscodex  
**Fecha de auditoría:** 2026-09-29  
**Alcance:** investigar fuentes gratuitas y reutilizables para efectos retro 8/16-bit y recursos visuales de SpriteCollab. No se han descargado ni añadido assets en esta ejecución.

## Finalidad

Definir una ruta segura para añadir sonido y pequeños recursos visuales a Roscodex sin convertir la partida en dependiente de una API, de una CDN o de una cuenta de pago. Cada recurso debe poder rastrearse hasta su fuente, licencia, autor y fecha de incorporación.

## Contexto del repositorio

La demo actual es una aplicación web estática con JavaScript, HTML y CSS. El juego carga el banco de preguntas y los recursos desde `demo/`; durante la partida no necesita consultar APIs externas.

Hallazgos de la inspección:

- No existe todavía una carpeta de audio ni referencias a `Audio`, `AudioContext`, `<audio>` o archivos de sonido.
- Hay 25 PNG locales en `demo/assets/sprites/`, numerados del `001.png` al `025.png`, usados como fondo pixelado.
- `demo/assets/sprites/LICENCE.txt` conserva la nota de PokéAPI: el repositorio declara CC0, pero las imágenes representan material de Pokémon cuyos derechos y marcas no quedan despejados por esa declaración.
- La fuente `Press Start 2P` ya está incluida con su `OFL.txt`.
- El banner SVG actual es código propio del proyecto; no debe confundirse con un asset de terceros.
- No hay un `package.json` ni un bundler en la demo actual. La estrategia de recursos debe funcionar primero con archivos estáticos y ser portable después a Flutter o a otro cliente.

### Diagnóstico

El problema no es que JavaScript sea incapaz de reproducir audio. Para efectos cortos, Web Audio es suficiente y evita cargar una librería pesada. El riesgo real sería introducir URLs remotas, audio con licencia ambigua o una colección de sprites cuyo permiso no cubra redistribución pública.

## Decisión recomendada

### Audio

1. **Opción principal: crear los efectos propios con jfxr o jsfxr.** El resultado es un efecto sintetizado, no una extracción de Pokémon, y se puede exportar a WAV para empaquetarlo localmente. jfxr declara que los sonidos creados con su herramienta son del usuario y que no requieren atribución; su código está bajo BSD de tres cláusulas. jsfxr ofrece presets retro y su repositorio aparece bajo Unlicense. Conviene conservar una captura o un JSON de parámetros por cada efecto para poder regenerarlo.
2. **Opción de biblioteca: Kenney Interface Sounds.** El pack concreto de interfaz contiene 100 archivos y la página del pack indica CC0. Es adecuado para clic, selección, confirmación y error si el sonido encaja con la identidad visual. Debe conservarse la URL del pack y la licencia aunque CC0 no obligue a atribuir.
3. **Opción de búsqueda puntual: Freesound.** No es una licencia única: cada sonido puede ser CC0, CC BY o CC BY-NC. Para Roscodex se aceptarán únicamente archivos con licencia explícita y verificable; preferiblemente CC0 o CC BY. CC BY exige crédito y CC BY-NC limita los usos comerciales, por lo que no es una buena base si algún día el proyecto cambia de modelo.
4. **Opción secundaria: OpenGameArt.** Puede aportar efectos y música, pero cada página de asset tiene sus propios términos. Nunca se debe reutilizar el audio del preview por defecto: el propio sitio avisa de que el preview puede tener una licencia distinta o estar reservado. Solo se incorporará el archivo descargable cuya ficha, autor y licencia hayan sido registrados.

### Recursos de SpriteCollab

SpriteCollab no debe tratarse como un banco genérico de iconos libres. Su README indica que, al enviar archivos al bot, se permite copiar, redistribuir y modificar el material bajo condiciones **no comerciales** y con atribución; enlaza expresamente a CC BY-NC 4.0. El repositorio también contiene gráficos oficiales de Chunsoft y un fichero de créditos por colaboradores. Por tanto:

- La licencia del repositorio no convierte automáticamente todos los gráficos representados en una licencia libre sobre Pokémon.
- Un archivo visual debe identificarse por especie/forma, tipo de recurso, autor y entrada de crédito, no solo por la URL del repositorio.
- La condición no comercial es compatible con el proyecto fan actual, pero no con monetización, publicidad de pago, venta de la aplicación o una futura reutilización comercial.
- Debe mantenerse la atribución indicada por SpriteCollab, junto con el enlace al repositorio, el enlace a CC BY-NC 4.0 y, cuando sea posible, los autores concretos de `spritebot_credits.txt`/`credit_names.txt`.
- No se incorporará un sprite oficial de Chunsoft ni un sprite cuyo autor o licencia no se pueda localizar.
- Para una primera versión pública en GitHub Pages, la opción de menor riesgo sigue siendo utilizar iconos pixel originales de Roscodex o placeholders abstractos. SpriteCollab queda como integración opcional pendiente de un manifiesto de assets y revisión individual.

## Fuentes investigadas

| Fuente | Qué aporta | Licencia/condición comprobada | Recomendación para Roscodex |
| --- | --- | --- | --- |
| [jfxr](https://github.com/ttencate/jfxr) | Generador de efectos retro en navegador | El código se declara BSD-3-Clause; el autor indica que los sonidos generados son del usuario y se pueden usar sin restricciones | **Preferida** para crear sonidos propios sin runtime externo |
| [jsfxr](https://github.com/chr15m/jsfxr) | Generador y librería JavaScript con presets 8-bit | Repositorio bajo Unlicense; permite generar WAV/data URI y reproducir con Web Audio | **Válida** para prototipar; exportar el resultado y no depender de la librería en producción |
| [Bfxr](https://www.bfxr.net/v1/) | Generador clásico de efectos 8-bit | El sitio del autor afirma que los sonidos creados tienen uso libre, incluso comercial | **Válida** como herramienta de creación; guardar los parámetros y exportaciones |
| [Kenney — Interface Sounds](https://kenney.nl/assets/interface-sounds) | 100 sonidos de interfaz | La página del pack indica Creative Commons CC0 | **Preferida** si se quiere una colección ya hecha; descargar solo tras decidir los archivos concretos |
| [Freesound — FAQ de licencias](https://freesound.org/help/faq/) | Catálogo grande de sonidos | Licencia por archivo: CC0, CC BY o CC BY-NC; se exige cumplir la licencia de cada autor | **Condicional**; filtrar y registrar cada archivo, autor, URL y licencia |
| [OpenGameArt — FAQ](https://opengameart.org/content/faq) | Audio y arte de comunidad | Licencia por asset; obliga a revisar atribución y advierte sobre previews no licenciados | **Condicional**; usar solo descargas con licencia inequívoca |
| [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab) | Sprites y retratos estilo Mystery Dungeon | Política del repositorio: CC BY-NC 4.0 para material aportado, con crédito; repositorio mixto con material oficial | **Pendiente**, no aprobado para copiar en bloque |
| [SpriteCollab — licencia](https://github.com/PMDCollab/SpriteCollab/blob/master/LICENSE.md) | Texto completo de CC BY-NC 4.0 | Permite compartir y adaptar solo para fines no comerciales y exige atribución | **Obligatorio** leer y conservar con cualquier incorporación |
| [SpriteCollab — créditos](https://github.com/PMDCollab/SpriteCollab/blob/master/spritebot_credits.txt) | Autores y recursos acreditados | Relaciona colaboradores y gráficos, incluyendo material no original de la comunidad | **Obligatorio** consultar por asset si se usa SpriteCollab |

Estas referencias se han consultado como documentación de las fuentes, no como permiso para redistribuir automáticamente todo su contenido.

## Licencias que sí y que no encajan

### Preferidas

- Audio generado por el equipo mediante jfxr, jsfxr o Bfxr, con parámetros guardados.
- CC0 para efectos descargados.
- CC BY para efectos descargados, si el crédito cabe en `Créditos` y en un fichero de avisos.
- Iconos y criaturas abstractas dibujadas específicamente para Roscodex.

### Admitidas con control adicional

- CC BY-NC 4.0 para un proyecto estrictamente fan y no comercial, con atribución completa.
- CC BY-SA u otras licencias copyleft, únicamente tras comprobar que no crean una obligación incompatible con el cliente móvil, la distribución web o la licencia del propio código.
- Recursos de OpenGameArt o Freesound cuando la licencia esté en la página individual y se haya archivado el registro de procedencia.

### No incorporar

- Sonidos extraídos de juegos, anime, televisión o consolas de Pokémon.
- Gritos, jingles o música reconocible de Pokémon sin permiso específico del titular.
- Un archivo cuya licencia solo aparezca en un comentario, en una vista previa o en un agregador sin fuente primaria.
- Assets “free” sin autor, licencia o URL estable.
- Recursos CC BY-NC si el proyecto incorpora anuncios, donaciones condicionadas, compras, patrocinio comercial o cualquier otra monetización.
- Sprites de SpriteCollab copiados en masa sin crédito por colaborador y sin comprobar que el archivo no sea material oficial.

## Plan de audio para la aplicación

### Catálogo mínimo

La primera versión sonora no necesita música constante. Bastan seis efectos muy cortos:

| ID | Evento | Diseño sugerido |
| --- | --- | --- |
| `ui-select` | Seleccionar dificultad o respuesta | Blip cuadrado ascendente, 60–100 ms |
| `ui-confirm` | Acierto | Dos o tres notas ascendentes, 180–260 ms |
| `ui-error` | Fallo | Tono descendente corto, 160–220 ms |
| `ui-pass` | Pasapalabra | Dos pulsos secos, 150–220 ms |
| `ui-timeout` | Tiempo agotado | Descenso grave y ruido breve, menos de 400 ms |
| `rosco-complete` | Fin de partida | Arpegio corto, menos de 700 ms |

No se deben imitar melodías, samples ni efectos identificables de la franquicia. La inspiración debe limitarse a la estética general de consolas retro: ondas cuadradas/triangulares, poco sustain, envolventes rápidas y una mezcla contenida.

### Formato y carga

- Exportar efectos cortos como WAV PCM mono, 16-bit, 22.05 kHz o 44.1 kHz. WAV evita sorpresas de compatibilidad y estos archivos serán pequeños.
- Reservar OGG para música o pistas más largas si algún día se añade una. No introducir música en la primera iteración si no aporta valor.
- Guardar todos los archivos bajo `demo/assets/audio/` y nunca apuntar desde la aplicación a una URL remota.
- Crear un manifiesto futuro, por ejemplo `demo/assets/audio/manifest.json`, con `id`, `path`, `event`, `license`, `author`, `sourceUrl`, `modified`, `sha256` y `notes`.
- Inicializar `AudioContext` solo después de un gesto del usuario, por ejemplo al elegir dificultad, para cumplir las políticas de autoplay de navegadores móviles.
- Decodificar una vez y mantener en memoria los `AudioBuffer` de los seis efectos. No hacer un `fetch` en cada respuesta.
- Añadir control de sonido activado/desactivado, volumen moderado y respeto por `prefers-reduced-motion` cuando el sonido acompañe a animaciones intensas.
- Si se incorpora un service worker en la futura versión PWA, cachear audio junto con CSS, JS, JSON, fuentes y sprites; el runtime no debe depender de que la CDN siga disponible.

La Web Audio API permite cargar el archivo local y decodificarlo con `decodeAudioData()` a un `AudioBuffer`, que después se reutiliza para reproducir efectos breves. Esto encaja con la demo estática actual y con una futura capa de infraestructura que abstraiga el motor de sonido.

### Fallback obligatorio

Si un archivo falla, el usuario debe poder jugar:

1. registrar el fallo en consola solo en modo desarrollo;
2. marcar el efecto como no disponible;
3. continuar sin sonido;
4. conservar feedback visual y textual;
5. ofrecer un botón de mute para evitar que el navegador vuelva a intentar cargarlo.

No se debe sustituir un asset caído por una URL externa en producción. Si la licencia deja de ser verificable, se elimina el archivo y se regenera un efecto propio con jfxr/jsfxr.

## Plan de SpriteCollab e iconos

### Política propuesta

SpriteCollab solo se podrá usar después de una revisión explícita por recurso. El proceso sería:

1. localizar el recurso en la copia oficial y anotar ruta, forma, autor y estado;
2. comprobar si el gráfico es custom de la comunidad o material oficial de Chunsoft;
3. rechazar cualquier recurso que no tenga autor/licencia trazable;
4. guardar una copia de la licencia y una línea de crédito en un manifiesto;
5. registrar que la adaptación es no comercial si se modifica el archivo;
6. mostrar un crédito agrupado en la pantalla de fuentes y conservar el texto completo en `THIRD_PARTY_NOTICES.md` cuando el proyecto empiece a empaquetar esos recursos.

### Aplicación visual de bajo riesgo

Antes de usar personajes de SpriteCollab, se puede obtener el mismo valor estético con:

- medallas de estado de 16×16 dibujadas para Roscodex;
- iconos geométricos de respuesta, tiempo y pasapalabra;
- pequeñas criaturas originales que no reproduzcan especies ni siluetas identificables;
- sprites abstractos de color para el fondo, generados por código o dibujados por el proyecto;
- retratos genéricos con paleta limitada, sin nombres ni rasgos de personajes protegidos.

Esto conserva la estética pixel y reduce el riesgo de que el recurso visual principal dependa de una licencia no comercial o de material de terceros.

## Registro de procedencia requerido

No se debe aceptar un asset sin una entrada equivalente a esta:

```json
{
  "id": "ui-confirm",
  "kind": "audio",
  "path": "demo/assets/audio/ui-confirm.wav",
  "source": "jfxr",
  "sourceUrl": "https://github.com/ttencate/jfxr",
  "author": "Generated by Roscodex",
  "license": "Generated output; see tool terms",
  "licenseUrl": "https://github.com/ttencate/jfxr/blob/master/LICENSE",
  "modified": false,
  "retrievedAt": "YYYY-MM-DD",
  "sha256": "",
  "notes": "Parameters stored in the asset log"
}
```

Para un archivo de Freesound, `author` debe ser el autor del sonido, `sourceUrl` la página individual y `license` la licencia que aparece en esa página; nunca basta con poner “Freesound”. Para SpriteCollab se deben añadir también `speciesOrForm`, `contributor` y `creditFileLine`.

## Criterios de aceptación antes de añadir assets

- La fuente primaria sigue accesible y la licencia se puede leer sin depender de un comentario o de una captura.
- Se conoce autor, URL, licencia, fecha de consulta y si el archivo fue modificado.
- El asset se puede servir localmente en GitHub Pages sin peticiones remotas.
- El archivo no contiene logos, voces, melodías o personajes de Pokémon extraídos de una obra oficial sin permiso.
- La licencia permite el uso no comercial del proyecto fan y sus términos se cumplen en la atribución.
- El recurso tiene una alternativa propia o se puede eliminar sin romper el juego.
- Se ha probado en móvil, escritorio, conexión lenta y sin red tras cargar la página.
- El tamaño es razonable: efectos cortos y pocos archivos, no un paquete de sprites o música innecesario.

## Resultado de la auditoría

**Aprobado para la siguiente fase:** generar seis efectos propios con jfxr/jsfxr o seleccionar efectos concretos de Kenney Interface Sounds y registrar su procedencia antes de incorporarlos.  
**Aprobado con condiciones:** Freesound y OpenGameArt, siempre con revisión por archivo.  
**Pendiente/no aprobado aún:** SpriteCollab para iconos o personajes; requiere manifiesto de assets, revisión de procedencia y crédito por colaborador.  
**No realizado:** descargas, modificaciones de código, incorporación de audio, incorporación de sprites y cambios de licencia.

## Fuentes primarias consultadas

- [jfxr — repositorio y licencia](https://github.com/ttencate/jfxr)
- [jsfxr — repositorio y licencia](https://github.com/chr15m/jsfxr)
- [Bfxr — términos de uso del autor](https://www.bfxr.net/v1/)
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds)
- [Freesound — FAQ de licencias y atribución](https://freesound.org/help/faq/)
- [OpenGameArt — FAQ de licencias y previews](https://opengameart.org/content/faq)
- [SpriteCollab — README y política de uso](https://github.com/PMDCollab/SpriteCollab/blob/master/README.md)
- [SpriteCollab — texto de licencia](https://github.com/PMDCollab/SpriteCollab/blob/master/LICENSE.md)
- [SpriteCollab — créditos por recurso](https://github.com/PMDCollab/SpriteCollab/blob/master/spritebot_credits.txt)
- [Creative Commons BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
- [MDN — `decodeAudioData()`](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)

> Esta auditoría es una guía técnica de procedencia y cumplimiento, no asesoramiento jurídico. Si el proyecto cambia de finalidad o empieza a monetizarse, hay que revisar de nuevo especialmente SpriteCollab, CC BY-NC y los recursos de Pokémon.
