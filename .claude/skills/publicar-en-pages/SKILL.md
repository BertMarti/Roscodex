---
name: publicar-en-pages
description: Comprobar en local y publicar Roscodex en GitHub Pages (https://bertmarti.github.io/Roscodex/). Úsala cuando haya que desplegar, revisar por qué Pages no se actualiza o cambiar la ruta base.
---

# Publicar Roscodex en GitHub Pages

La web se publica sola con `.github/workflows/deploy-pages.yml` en cada push a `main` (también se puede lanzar a mano desde Actions → «Deploy Roscodex to GitHub Pages» → Run workflow).

## Antes de fusionar a main

1. `npm ci` (si cambió `package-lock.json`).
2. `npm run check` → tipos, Vitest, validación del banco y simulación de partidas.
3. `npm run build` → genera `dist/` con base `/Roscodex/` (definida en `vite.config.ts`; la **R** es mayúscula y GitHub Pages distingue mayúsculas).
4. `npm run preview` y abre `http://localhost:4173/Roscodex/`:
   - la portada carga con fuente pixel y fondo de sprites;
   - empezar una partida carga `data/question-bank.json` (pestaña Red sin 404);
   - consola sin errores de Content-Security-Policy.
5. Opcional: captura con Chromium sin cabeza (ver el subagente `probador-ui`).

## Si Pages no se actualiza

- `gh run list --workflow deploy-pages.yml --limit 5` y `gh run view <id> --log-failed`.
- Settings → Pages → Source debe ser **GitHub Actions** (`gh api repos/BertMarti/Roscodex/pages --jq .build_type` → `workflow`).
- La PWA usa service worker con `autoUpdate`: tras desplegar, recarga dos veces o abre en privado para ver la versión nueva.

## Builds móviles (Capacitor)

Los scripts `mobile:*` reconstruyen con `--base=/`. No subas esa `dist/` a Pages.
