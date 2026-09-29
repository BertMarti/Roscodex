# Servicios gratuitos y control del coste

## Objetivo realista

Una demo ejecutada en el ordenador o en un dispositivo propio puede mantenerse a coste cero de forma indefinida si todos los datos y recursos están dentro del repositorio.

No se puede garantizar que un proveedor externo mantenga para siempre sus cuotas gratuitas, políticas o disponibilidad. Por eso el MVP no dependerá de ellos para jugar.

## Servicios recomendados para el MVP

| Servicio | Uso | ¿Obligatorio? | Coste de la demo |
|---|---|---:|---:|
| Flutter | Aplicación | Sí | 0 € |
| VS Code | Editor | Sí | 0 € |
| Android Studio | SDK y emulador | Para Android | 0 € |
| Git | Versionado local | Sí | 0 € |
| GitHub | Copia remota opcional | No | 0 € en uso básico |
| PokéAPI | Investigación/importación | No en ejecución | 0 € según sus condiciones |
| Figma | Diseño opcional | No | 0 € en uso básico |

## Servicios que se posponen

- Supabase.
- Firebase.
- Hosting web.
- Dominio.
- CDN de imágenes.
- Analytics.
- Notificaciones push.
- Ranking online.

Supabase y Firebase tienen integraciones gratuitas, pero añadirlos no hace que el coste esté garantizado “para toda la vida”. Si se utilizan más adelante, deben ser opcionales y tener un modo degradado local.

## Hosting

Para la demo local no hace falta hosting.

Si más adelante se quiere compartir una demo web estática, se puede estudiar GitHub Pages, pero no debe considerarse necesario para el MVP ni utilizarse para alojar datos sensibles.

## Reglas anti-coste

- No introducir tarjetas de crédito para arrancar la demo.
- No almacenar secretos en el repositorio.
- No llamar a APIs por cada pregunta si se puede precargar el contenido.
- No utilizar imágenes externas en cada renderizado.
- No activar servicios cloud antes de necesitarlos.
- Comprobar licencias y límites antes de subir recursos.
- Mantener una copia local de todo lo necesario para jugar.
