# Modernización técnica de Roscodex

## Decisión

Roscodex evoluciona de una demo con HTML, CSS y un único `app.js` a:

- **React 19 + TypeScript:** componentes y contratos tipados para el rosco, la partida y los modales.
- **Vite 8:** desarrollo rápido y build estática optimizada para GitHub Pages.
- **PWA con precache:** la aplicación y el banco local pueden funcionar sin conexión después de la primera carga.
- **Capacitor 8 preparado:** la misma build web puede empaquetarse como aplicación Android/iOS cuando exista el entorno nativo correspondiente.
- **Web Audio API:** efectos 8-bit generados localmente; no se añaden descargas de audio ni dependencias de pago.

La aplicación sigue siendo gratuita y offline-first. GitHub Pages continúa siendo el alojamiento web público a coste cero.

## Por qué no Flutter ahora

Flutter es una alternativa válida, pero no está instalado en el entorno y obligaría a reimplementar la interfaz pixel-art ya validada. React + TypeScript conserva el trabajo visual existente, mejora la separación de responsabilidades y deja una salida móvil mediante Capacitor sin mantener dos interfaces.

## Estructura nueva

```text
src/
├── App.tsx       # pantallas, rosco, pregunta y modales
├── game.ts       # tipos, selección sin repetición y utilidades de partida
├── audio.ts      # sintetizador retro con Web Audio
├── main.tsx      # punto de entrada React
└── styles.css    # tokens y estética pixel-art
public/
├── data/         # banco local y caché de datos
└── assets/       # sprites, fuente y recursos estáticos
scripts/          # generación, validación y simulación del contenido
dist/             # salida generada de Vite; no se versiona
```

## Rendimiento y compatibilidad

- El banco se carga una vez y el service worker de la PWA precachea la build.
- Los sprites y la fuente se sirven localmente; no hay peticiones de APIs durante la partida.
- Los efectos de sonido solo crean un `AudioContext` tras una interacción del usuario.
- La ruta Vite usa `/Roscodex/` para GitHub Pages y los scripts `mobile:*` pasan `--base=/` para Capacitor.
- La interfaz conserva CSS pixel-art, rosco circular, estados de color y soporte `prefers-reduced-motion`.
- Capacitor apunta a `dist/`; en Android se requerirán Android Studio/JDK y en iOS macOS/Xcode. Esas herramientas no son necesarias para la PWA.

## Audio y sprites

La primera implementación usa tonos propios sintetizados para eliminar dudas de redistribución. Como alternativas futuras se han documentado packs CC0 de Kenney y OpenGameArt, siempre conservando el archivo de licencia y la atribución correspondiente.

SpriteCollab se enlaza como fuente de referencia, pero no se copian automáticamente sprites comunitarios: su política exige uso no comercial y crédito, y mezcla material oficial con contribuciones de autores distintos. Cualquier incorporación futura debe registrar autor, URL, licencia y hash en un manifiesto de assets.

## Verificación de esta fase

- TypeScript sin errores con `npm run typecheck`.
- Banco válido: 4 dificultades, 2.080 preguntas únicas, 20 por letra y distribución 360/160.
- Simulación: 80 partidas y 2.080 preguntas consumidas sin repetir.
- Build Vite con PWA y assets precacheados completada.

## Referencias

- [Vite — despliegue estático y GitHub Pages](https://vite.dev/guide/static-deploy)
- [React — TypeScript](https://react.dev/learn/typescript)
- [Capacitor — runtime multiplataforma](https://capacitorjs.com/docs)
- [SpriteCollab — política de uso](https://github.com/PMDCollab/SpriteCollab)
- [Kenney Interface Sounds — CC0](https://kenney.nl/assets/interface-sounds)
