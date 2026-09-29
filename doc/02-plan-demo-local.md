# Plan de acción para la demo local

## Objetivo

Conseguir una primera versión jugable en local, sin cuentas externas obligatorias y sin pagar ningún servicio.

## Estado actual

La vertical slice se ha modernizado a React + TypeScript + Vite. El build web se sirve como PWA y la configuración de Capacitor permite reutilizarlo en móvil sin mantener una segunda interfaz.

## Fase 0 — decisiones rápidas

Cerrar estas decisiones antes de programar:

- React + TypeScript + Vite.
- PWA offline-first y Capacitor como salida móvil opcional.
- Android como primera plataforma de prueba.
- Rosco A-Z con 26 letras en la demo inicial.
- Preguntas almacenadas en JSON.
- Tiempo global por partida.
- Las letras pasadas vuelven en una segunda vuelta.
- El botón de créditos abre un diálogo o bottom sheet, no un bloque de texto permanente.

## Fase 1 — crear el proyecto

Instalar gratuitamente:

- Node.js y npm.
- VS Code y extensiones TypeScript.
- Android Studio/Android SDK solo para probar la salida Android de Capacitor.
- Git.

Comprobación inicial:

```bash
npm install
npm run typecheck
npm run dev
```

El nombre real del paquete debe decidirse antes de publicar; durante la demo puede mantenerse privado y provisional.

## Fase 2 — estructura mínima

La base actual se organiza así:

```text
src/
  App.tsx
  game.ts
  audio.ts
  main.tsx
  styles.css

public/
  data/
  assets/
```

Los datos y recursos se sirven desde `public/` y Vite los incorpora al artefacto web.

## Fase 3 — vertical slice

Implementar solo tres letras y una dificultad:

1. Inicio.
2. Selección de dificultad.
3. Rosco.
4. Pregunta activa.
5. Respuesta correcta.
6. Respuesta incorrecta.
7. Pasapalabra.
8. Siguiente letra.
9. Resultado.

No añadir todavía ranking, login, red ni publicidad.

## Fase 4 — motor de partida

Estados mínimos:

```text
idle
starting
active
showingFeedback
waitingNextLetter
finished
```

Estado de una letra:

```text
pending
active
correct
wrong
passed
expired
```

El motor debe ser independiente de la UI para poder probarlo con tests unitarios.

## Fase 5 — contenido completo

- Mantener al menos 500 preguntas por dificultad y 20 candidatas por letra.
- Mantener aproximadamente 70 % “Empieza por…” y 30 % “Contiene…”.
- Crear al menos un pack por dificultad para la demo.
- Revisar manualmente las preguntas.
- Guardar la fuente de cada dato en metadatos internos.

## Fase 6 — pixel-art

- Aplicar paleta limitada.
- Crear un panel pixelado para la pregunta.
- Añadir pulso de la letra activa.
- Añadir transiciones cortas.
- Evitar partículas y animaciones que dificulten la lectura.

## Fase 7 — pantalla fan y créditos

Mostrar inicialmente solo:

```text
Proyecto fan no oficial de Pokémon
Sin afiliación ni patrocinio oficial

[Más información y fuentes]
```

Al pulsar el botón, abrir información completa con fuentes y atribuciones. El juego debe seguir siendo usable sin obligar al usuario a leer el texto.

## Fase 8 — pruebas locales

Ejecutar:

```bash
npm run typecheck
npm run validate:content
npm run simulate:games
npm run build
```

Comprobar manualmente:

- El temporizador no se duplica.
- Al volver de segundo plano no se puede ganar tiempo indebidamente.
- Pasapalabra no elimina la letra de la segunda vuelta.
- El resultado no aparece antes de mostrar el feedback.
- El juego funciona sin conexión.
- Los textos largos no rompen la pantalla.

## Definición de “demo terminada”

- Se puede iniciar una partida desde cero.
- Se puede completar o agotar el tiempo.
- Todas las letras tienen una pregunta válida.
- Correcta, incorrecta y pasada se distinguen visualmente.
- La aplicación funciona sin Internet después de compilarse.
- La pantalla fan es visible pero no invasiva.
- Hay una guía para ejecutar el proyecto desde cero.
