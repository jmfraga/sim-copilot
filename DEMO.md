# Cómo correr la demo en vivo

> Guion de ~5 minutos para mostrar el Sim Copilot funcionando.

## Antes

1. `npm run dev -- -H 0.0.0.0 -p 3000` (así se puede proyectar desde otra máquina de la red).
2. Llaves: en `/settings` (UI) o en `.env.local` (ver `.env.example`).

## Guion

1. **Inicio** — En `/`, muestra el caso precargado *"Dolor torácico → paro por FV"* con sus
   4 objetivos de aprendizaje. Si no existe, el botón "Cargar caso de ejemplo" lo crea.
2. **Disparar sesión** — "▶ Sesión replay". Se abre la pantalla del copiloto con la máquina
   de estados arriba (`prep → prebriefing → escenario → debriefing → reporte`).
3. **Replay** — "▶ Iniciar replay": el transcript de ejemplo entra en chunks como si se
   estuviera transcribiendo en vivo, etiquetado con la fase activa. Avanza de fase con el
   botón; el replay espera solo si el siguiente fragmento pertenece a la fase que sigue.
4. **La magia** — Al pasar de *escenario* a *debriefing* (tarda unos segundos): aparecen los
   📌 momentos clave cruzados con los objetivos y el 🧭 plan de debriefing PEARLS. Durante el
   debriefing van cayendo 💡 tips en vivo cada ~25 s.
5. **Cierre** — Al pasar a *reporte*: se genera el 📄 reporte + retroalimentación al
   instructor (modelo fuerte). Botón "⬇ Exportar .md".
6. **Mic real** — En cualquier sesión, "🎙 Mic en vivo" captura audio en chunks de 12 s y los
   transcribe con el proveedor configurado (toggle excluyente con el replay).
7. **Settings** — En `/settings`, muestra la precedencia: lo guardado en la UI (SQLite local)
   pisa a la variable de entorno; las llaves se ven enmascaradas.

## Reset para re-demo

Borra `data/` (la DB y reportes se regeneran solos; el esquema es idempotente).
