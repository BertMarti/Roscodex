# Roadmap de agentes

## Cómo utilizar estos agentes

Cada agente tiene una finalidad concreta. No se debe pedir a un agente que modifique áreas de otro sin indicar la dependencia y actualizar el documento correspondiente.

Orden recomendado:

```text
Producto → UX/UI → Datos → Arquitectura → Motor → Interfaz → QA → Tooling
```

El agente de datos puede trabajar en paralelo con UX/UI. QA empieza cuando exista una primera vertical slice jugable.

## Mapa de labores

| Orden | Agente | Finalidad | Entregable principal | Depende de |
|---:|---|---|---|---|
| 1 | Product Owner | Cerrar reglas y alcance | Especificación funcional | Ninguno |
| 2 | UX/UI Pixel | Diseñar flujo y estética | Wireframes, tokens y estados visuales | Product Owner |
| 3 | Content & PokéAPI | Generar y validar preguntas | `question-bank.json`, `build-question-bank.mjs`, caché y fuentes | Product Owner |
| 4 | Flutter Architect | Preparar estructura técnica | Proyecto Flutter y arquitectura | Product Owner |
| 5 | Game Engine | Implementar la partida | Estado, timer y reglas | Arquitectura, Producto |
| 6 | Pixel UI | Implementar pantallas y animaciones | Interfaz jugable | UX/UI, Arquitectura |
| 7 | Assets & Attribution | Gestionar recursos y créditos | Assets permitidos y texto legal | UX/UI, Datos |
| 8 | QA | Verificar comportamiento y contenido | Tests y lista de defectos | Motor, UI, Datos |
| 9 | Local Tooling | Mantener ejecución repetible | README de instalación y scripts | Arquitectura |

## Entrega por hitos

### Hito 1 — especificación

- Reglas cerradas.
- Nombre de trabajo.
- A-Z o A-Ñ definido.
- Flujo de Pasapalabra decidido.
- Tiempos iniciales definidos.

### Hito 2 — vertical slice

- Una dificultad.
- Tres letras.
- Preguntas locales.
- Temporizador.
- Respuesta correcta, incorrecta y pasada.
- UI pixel-art básica.

### Hito 3 — demo completa

- Cuatro niveles.
- Rosco completo.
- Segunda vuelta.
- Pantalla de resultados.
- Créditos expandibles.
- Tests automatizados principales.

### Hito 4 — demo distribuible localmente

- Instalación reproducible.
- APK debug o ejecución en emulador.
- Sin conexión comprobada.
- Sin secretos en el repositorio.
- Guía de prueba.

## Reglas de coordinación

- Leer primero el estado real del repositorio.
- No borrar cambios existentes de otros agentes.
- No introducir una dependencia externa sin justificarla.
- No sustituir JSON local por backend durante el MVP.

## Agentes de auditoría de la demo

Estos agentes se incorporan después de la primera vertical slice y trabajan sobre el estado real de `demo/`:

| Agente | Finalidad | Documento |
|---|---|---|
| Auditor de aplicación | Recorrer el flujo y priorizar defectos | `doc/agents/09-app-auditor.md` |
| Revisor UI/UX pixel Pokémon | Revisar jerarquía, rosco, legibilidad y accesibilidad | `doc/agents/10-ui-ux-reviewer.md` |
| Optimizador de preguntas y respuestas | Validar contenido, fuentes y equilibrio 70/30 | `doc/agents/11-content-balance.md` |

Su contexto compartido y el registro de decisiones se mantiene en `doc/09-auditoria-mejoras-y-contexto.md`.
- Cada entrega debe incluir archivos modificados, pruebas ejecutadas y pendientes.
- Si un agente detecta una decisión abierta, actualizar `08-decisiones-abiertas.md`.
