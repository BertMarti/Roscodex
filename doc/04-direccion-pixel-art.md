# Dirección visual pixel-art

## Objetivo visual

Una interfaz legible, nostálgica y moderna: inspiración de consolas portátiles clásicas sin copiar una interfaz, logotipo o juego concreto.

## Reglas

- Usar una cuadrícula visual de 8 px o 4 px.
- Mantener bordes duros y evitar sombras borrosas.
- Utilizar una fuente pixel legible.
- Reservar la animación para estados importantes.
- Priorizar contraste y lectura sobre decoración.
- Mantener botones grandes para uso táctil.
- No usar únicamente el color para indicar estados.

## Paleta inicial

```text
Fondo oscuro:       #111827
Panel:              #1F2937
Panel claro:        #374151
Texto principal:    #F9FAFB
Texto secundario:   #CBD5E1
Activo/amarillo:    #FACC15
Correcto/verde:     #4ADE80
Incorrecto/rojo:   #F87171
Pasado/azul:        #60A5FA
Marco pixel:        #0B1020
```

La paleta puede cambiarse mediante tokens de tema, no desde cada widget.

## Componentes

### Rosco

- Círculo formado por 26 fichas.
- Tamaño suficientemente grande para pulsar cada ficha.
- Letra activa con pulso suave.
- Estado indicado por color, icono y texto accesible.

### Pregunta

- Panel central con marco pixelado.
- Etiqueta “Empieza por X” o “Contiene X”.
- Texto con tamaño adaptable.
- Cuatro botones verticales.
- Botón Pasapalabra separado visualmente.

### Feedback

- Duración inicial: 700–1000 ms.
- Verde o rojo con icono.
- Mostrar la respuesta correcta si se falla.
- No pausar el temporizador más tiempo del necesario.

## Animación de latido

La letra activa debe hacer un ciclo simple:

```text
escala 1.00 → 1.08 → 1.00
opacidad 1.00 → 0.88 → 1.00
duración aproximada: 900 ms
repetición: mientras la pregunta esté activa
```

Debe existir una opción futura de reducir animaciones para accesibilidad.

## Pantalla inicial

La información fan no ocupará toda la pantalla. Se mostrará una línea breve y un botón `Más información y fuentes`, que abrirá un diálogo o bottom sheet con el texto completo.
