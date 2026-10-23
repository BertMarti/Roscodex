# CLAUDE.md — Roscodex

Lee primero **[AGENTS.md](AGENTS.md)**: estructura, comandos, convenciones y reglas de seguridad. Este archivo solo añade lo propio de Claude Code.

- Estado y decisiones: [MEMORY.md](MEMORY.md). Hoja de ruta: [PLAN.md](PLAN.md). Detalle técnico: [doc/DESARROLLO.md](doc/DESARROLLO.md).
- Antes de dar algo por terminado: `npm run check` (tipos + Vitest + validación del banco + simulación) y `npm run build`.
- Para ver la app como en Pages: `npm run build && npm run preview` y abre `http://localhost:4173/Roscodex/` (ojo a la **R** mayúscula).
- Subagentes en `.claude/agents/`: `probador-ui` (capturas y accesibilidad), `revisor-banco-preguntas` (calidad del contenido), `revisor-seguridad` (CSP, dependencias, secretos).
- Skills en `.claude/skills/`: `publicar-en-pages` y `regenerar-banco-preguntas`.
- Textos de interfaz y commits en español de España. Nada de `innerHTML`/`dangerouslySetInnerHTML`, ni servicios de pago, ni llamadas a APIs durante la partida.
- La Raspberry Pi donde suele trabajarse es modesta: no lances varios `vite build` a la vez.
