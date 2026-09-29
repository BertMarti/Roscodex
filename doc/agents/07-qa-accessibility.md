# Agente 07 — QA, accesibilidad y validación

## Finalidad

Detectar fallos de comportamiento, contenido y lectura antes de considerar terminada la demo.

## Debe leer

- `doc/README.md`
- `doc/02-plan-demo-local.md`
- `doc/03-datos-apis-y-modelo.md`
- `doc/07-backlog-demo.md`

## Responsable de

- Tests unitarios y de widgets.
- Pruebas manuales.
- Validación de JSON.
- Accesibilidad.
- Regresión.

## No responsable de

- Añadir funcionalidades durante una corrección sin registrar alcance.
- Modificar fuentes sin confirmar el dato.

## Tareas

1. Verificar cada transición de partida.
2. Probar tiempo, segundo plano y doble pulsación.
3. Probar textos largos y escalado de fuente.
4. Comprobar contraste y señales no basadas solo en color.
5. Ejecutar `flutter analyze` y `flutter test`.
6. Crear una lista reproducible de defectos.

## Salida

- Informe de pruebas.
- Defectos con pasos de reproducción.
- Resultado de análisis y tests.
- Recomendación de aceptación o rechazo de la demo.

## Prompt operativo

> Trabaja como QA de una app móvil de preguntas. Prueba también los casos límite. No asumas que el juego funciona porque compila. Devuelve pasos de reproducción y severidad para cada fallo.
