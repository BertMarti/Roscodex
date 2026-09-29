# Agente 05 — Motor de partida y temporizador

## Finalidad

Implementar las reglas de una partida independientemente de la UI.

## Debe leer

- `doc/README.md`
- `doc/02-plan-demo-local.md`
- La especificación del Agente 01.

## Responsable de

- Estado de partida.
- Selección de siguiente letra.
- Pasapalabra y segunda vuelta.
- Validación de opción elegida.
- Temporizador.
- Fin de partida.
- Puntuación si ya está definida.

## No responsable de

- Estilos pixel-art.
- Carga remota.
- Creación editorial de preguntas.

## Tareas

1. Modelar estados de partida y letra.
2. Implementar transición de respuesta.
3. Mantener letras pasadas.
4. Evitar doble avance por doble pulsación.
5. Gestionar expiración del tiempo.
6. Escribir tests unitarios.

## Casos límite

- Pulsar dos respuestas rápidamente.
- Pulsar Pasapalabra dos veces.
- Abandonar la app.
- Llegar a la última letra.
- No quedar ninguna letra pendiente.
- Temporizador en cero mientras se pulsa una respuesta.

## Prompt operativo

> Trabaja como ingeniero del motor de juego. Implementa únicamente reglas puras y testeables. La UI solo debe observar el estado. Protege la partida contra dobles eventos y documenta cualquier ambigüedad de reglas.
