# Plan de acción para la demo local

## Objetivo

Conseguir una primera versión jugable en local, sin cuentas externas obligatorias y sin pagar ningún servicio.

## Estado actual

Ya existe una primera vertical slice web en `demo/`. Se ejecuta con un servidor estático de Python y permite validar la experiencia antes de instalar Flutter. El siguiente paso técnico será trasladar los modelos, reglas y estados visuales validados a Flutter.

## Fase 0 — decisiones rápidas

Cerrar estas decisiones antes de programar:

- Flutter + Dart.
- Android como primera plataforma de prueba.
- Rosco A-Z con 26 letras en la demo inicial.
- Preguntas almacenadas en JSON.
- Tiempo global por partida.
- Las letras pasadas vuelven en una segunda vuelta.
- El botón de créditos abre un diálogo o bottom sheet, no un bloque de texto permanente.

## Fase 1 — crear el proyecto

Instalar gratuitamente:

- Flutter SDK.
- Dart incluido con Flutter.
- VS Code y extensiones Flutter/Dart.
- Android Studio, Android SDK y un emulador.
- Git.

Comprobación inicial:

```bash
flutter doctor
flutter create roscodex_app
cd roscodex_app
flutter run
```

El nombre real del paquete debe decidirse antes de publicar; durante la demo puede mantenerse privado y provisional.

## Fase 2 — estructura mínima

Crear:

```text
lib/
  main.dart
  models/
  repositories/
  services/
  features/
  widgets/

assets/
  data/questions.json
  fonts/
  sprites/
```

Registrar el JSON y los recursos en `pubspec.yaml`.

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

- Crear 26 preguntas por pack.
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
flutter analyze
flutter test
flutter run
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
