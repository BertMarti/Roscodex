# Roscodex — documentación del proyecto

## Propósito

Roscodex es una demo de un rosco de preguntas inspirado en el formato de “pasapalabra”, con temática fan de Pokémon y estética pixel-art.

El objetivo es mantener una aplicación jugable, offline, gratuita y verificable en web y móvil.

## Principios del proyecto

1. **Coste cero para la demo:** sin servidores, cuentas de pago, dominios, bases de datos alojadas ni servicios obligatorios.
2. **Offline-first:** las preguntas, configuración y recursos necesarios para jugar se empaquetan localmente.
3. **Fuentes separadas del juego:** las APIs se usan para recopilar o actualizar datos, no para bloquear una partida.
4. **Identidad visual propia:** estilo pixel-art original; no copiar logotipos, música, interfaz ni material promocional oficial.
5. **Contenido verificable:** cada pregunta debe tener fuente, versión y revisión.
6. **Agentes especializados:** cada labor tiene un responsable, un documento de contexto y criterios de finalización.

## Decisión técnica inicial

| Área | Decisión para la demo | Motivo |
|---|---|---|
| Aplicación | React + TypeScript + Vite | Base web moderna, tipada y optimizada |
| PWA/móvil | Vite PWA + Capacitor | Web instalable y empaquetado móvil desde la misma build |
| Editor | VS Code | Ligero y suficiente para TypeScript |
| SDK Android/iOS | Opcional para la PWA; Android Studio/Xcode para Capacitor | Solo necesario al preparar builds nativas |
| Datos | JSON local | Cero coste, fácil de versionar y funciona sin conexión |
| Imágenes | Pixel-art propio o sprites cacheados para demo | Evitar dependencia de red durante el juego |
| Fuentes de datos | PokéAPI para datos estructurados | No existe necesidad de consultar preguntas en directo |
| Persistencia local | `shared_preferences` o archivo local | Ajustes y récords sencillos |
| Backend | Ninguno en el MVP | Mantiene el coste y la complejidad a cero |
| Control de versiones | Git | Historial y trabajo seguro |

La decisión completa y sus límites están documentados en [11-modernizacion-stack.md](11-modernizacion-stack.md).

## Documentos de este directorio

- [01-roadmap-agentes.md](01-roadmap-agentes.md): mapa de labores, agentes, orden y dependencias.
- [02-plan-demo-local.md](02-plan-demo-local.md): plan de acción para ejecutar una primera demo local.
- [03-datos-apis-y-modelo.md](03-datos-apis-y-modelo.md): fuentes, estrategia de preguntas, JSON y validaciones.
- [04-direccion-pixel-art.md](04-direccion-pixel-art.md): reglas visuales y UI pixel-art.
- [05-servicios-gratuitos-y-coste.md](05-servicios-gratuitos-y-coste.md): qué usar, qué no usar y límites del “gratis para siempre”.
- [06-atribucion-y-pantalla-inicial.md](06-atribucion-y-pantalla-inicial.md): texto de proyecto fan, créditos y diseño no invasivo.
- [07-backlog-demo.md](07-backlog-demo.md): tareas ordenadas para comenzar el desarrollo.
- [08-decisiones-abiertas.md](08-decisiones-abiertas.md): decisiones que deben cerrarse antes de ampliar el alcance.
- [09-auditoria-mejoras-y-contexto.md](09-auditoria-mejoras-y-contexto.md): auditoría por agentes, contexto acumulado y decisiones de la última iteración.
- [10-guia-de-usuario.md](10-guia-de-usuario.md): explicación de la aplicación, reglas, dificultades, controles y solución de problemas.
- [11-modernizacion-stack.md](11-modernizacion-stack.md): migración a React, TypeScript, Vite, PWA y Capacitor.
- [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md): plantilla común para nuevos agentes.

## Aplicación actual

La aplicación se construye desde `src/` con Vite y publica una PWA estática. El artefacto de GitHub Pages se genera en `dist/`; no se mantiene una copia manual de la demo compilada dentro del repositorio.

## Agentes

Los documentos específicos están en [doc/agents](agents). Cada agente debe leer, en este orden:

1. Este documento.
2. Su documento de rol.
3. Los documentos que su rol indique como entrada.
4. El estado real del repositorio antes de modificar archivos.

Agentes definidos:

- Product Owner y reglas del juego.
- UX/UI pixel-art.
- Arquitectura React + TypeScript + Capacitor.
- Motor de partida y temporizador.
- Contenido, preguntas y PokéAPI.
- Recursos visuales y atribución.
- QA, accesibilidad y validación de contenido.
- Tooling, ejecución local y Git.
- Auditoría de aplicación y priorización de defectos.
- Revisión UI/UX pixel Pokémon.
- Optimización y equilibrio de preguntas y respuestas.

## Alcance del MVP

Incluido:

- Pantalla de inicio.
- Mensaje de proyecto fan con botón de información expandible.
- Selección de principiante, normal, difícil y extremo.
- Rosco A-Z para la primera demo.
- Preguntas de “Empieza por…” y “Contiene…”.
- Cuatro respuestas y botón “Pasapalabra”.
- Temporizador global.
- Estados visuales correcta, incorrecta, pasada y agotada.
- Segunda vuelta para letras pasadas.
- Resultados finales.
- Preguntas locales en JSON.
- Estética pixel-art.

Fuera del MVP:

- Login.
- Ranking online.
- Chat o multijugador.
- Compras, publicidad o monetización.
- Panel web de administración.
- Dependencia obligatoria de APIs en tiempo de ejecución.

## Nota legal y de marca

Es un proyecto fan no oficial. Pokémon, sus nombres, personajes, imágenes y otros elementos pueden estar protegidos por derechos de propiedad intelectual de sus titulares. La [información legal de Pokémon](https://www.pokemon.com/es/legal/informacion) y la [política de uso de material de Pokémon](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials) deben revisarse antes de compartirlo públicamente.

La demo se documenta como local, no comercial y sin afiliación. No se debe presentar como producto oficial ni utilizar el logotipo, música, capturas o recursos promocionales oficiales.
