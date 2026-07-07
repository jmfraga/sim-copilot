# Sim Copilot MVP

Copiloto de simulación clínica en tiempo real: escucha la sesión, arma la línea de tiempo por
fases (`prep → prebriefing → escenario → debriefing → reporte`), extrae momentos clave cruzados
con los objetivos de aprendizaje, propone un debriefing estructurado (PEARLS / advocacy-inquiry /
plus-delta) con tips en vivo, y genera un reporte final con retroalimentación al instructor.

**Este proyecto fue construido de forma autónoma por Claude Code en ~2 horas** durante la sesión 4
del curso *Haz Magia con Claude* (SimAcademy). El prompt/spec completo que lo construyó está en
[`DEMO_BUILD.md`](./DEMO_BUILD.md) — es a la vez la receta del build y un ejemplo de prompt para
trabajo autónomo. **Forkéalo, rómpelo, mejóralo.**

## Correr

```bash
npm install
cp .env.example .env.local   # pon tus llaves, o configúralas en /settings
npm run dev
```

- **Modo REPLAY**: funciona sin micrófono ni llaves de transcripción, con un transcript de ejemplo.
- **Modo LIVE**: requiere proveedor de transcripción (endpoint estilo `/audio/transcriptions`).
- **IA**: momentos clave y tips usan un modelo rápido; el reporte final, uno fuerte (default Anthropic).

## Advertencias (demo-grade, NO producción)

- Las llaves guardadas desde la página Settings van a SQLite local **sin cifrar**.
- No hay auth, ni multiusuario, ni manejo de PHI. Es una demo de alcances de Claude Code.

## Licencia

MIT — ver [LICENSE](./LICENSE).
