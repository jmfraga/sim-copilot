# DEMO_BUILD.md — Sim Copilot MVP (build autónomo con Claude Code)

> **Qué es esto:** el prompt/spec que Claude Code ejecuta de forma autónoma (`/goal` + auto mode)
> para construir, en ~2.1 horas (de inicio a demo) y sin supervisión turno a turno, un MVP de **copiloto de simulación
> clínica en tiempo real**. Este archivo vive en el repo público del proyecto: es a la vez la
> receta del build **y** un ejemplo de prompt de Claude Code para que cualquiera lo forkee y adapte.
>
> **Curso:** SimAcademy — *Haz Magia con Claude*, sesión 4.
> **Licencia:** MIT. Forkéalo, rómpelo, mejóralo.

---

## Cómo se corre (referencia rápida para el instructor)

Requisitos previos (fuera de cámara, antes de clase):

- Claude Code **v2.1.139+** (mínimo para `/goal`).
- La sesión corre **en la máquina donde vive m4-hub**: su escáner solo lee el directorio
  local de proyectos, así que el build debe nacer ahí para poder registrarse.
- `gh` autenticado (`gh auth status` ✅).
- `.env.local` con las llaves reales para que el worker pueda **auto-probar** las llamadas
  durante el build. **Nunca** se commitea (ver guardrails).
- **Auto mode ON** en la sesión (aprueba tool calls sin preguntar cada uno).

Luego, frente al grupo, se dispara **una sola línea** (la condición `/goal`, más abajo en
"La condición `/goal`"). A partir de ahí Claude Code avanza turno tras turno solo; tú das clase
y revisas `PROGRESS.md` en los recesos.

> **La lección de prompt-craft del día:** `/goal` corre un evaluador (modelo rápido) que después
> de cada turno decide si la condición se cumplió — pero **solo ve lo que Claude escribió en la
> conversación**; no lee archivos ni corre comandos por su cuenta. Por eso la condición está
> redactada para ser **auto-demostrable en el transcript** ("corre X y muestra el resultado"),
> mientras que el spec granular vive aquí, en el archivo que el *worker* sí lee. Worker: lee y
> ejecuta. Evaluador: solo juzga lo impreso. Diséña tus goals para ese ojo ciego.

---

## Objetivo del proyecto

Construir un **MVP funcional** de copiloto de simulación clínica que:

1. **Escucha** la sesión de simulación (transcripción por chunks, se *lee* como tiempo real).
2. Corre una **máquina de estados** que el instructor avanza con botones:
   `prep → prebriefing → escenario → debriefing → reporte`.
3. Construye una **línea de tiempo** del proceso, con cada segmento etiquetado por fase.
4. Al cerrar el escenario, extrae los **momentos clave** cruzándolos con los objetivos de
   aprendizaje, y genera un **debriefing estructurado** (marco PEARLS / advocacy-inquiry / plus-delta).
5. Durante el debriefing, muestra esos momentos y va dando **tips en vivo** al instructor
   (que él usa o no).
6. Al final, produce un **reporte + retroalimentación al instructor**, guardado y exportable.

**No es un proyecto de producción.** Es una demo de los alcances de Claude Code. Prioriza
*software funcionando temprano* sobre pulido.

---

## Stack (fijo, elegido por robustez para un build desatendido)

- **Next.js 15 (App Router, TypeScript, Tailwind)** — full-stack, un solo proceso.
- **SQLite vía `better-sqlite3`** — sin migraciones frágiles; init de esquema idempotente.
- **Transcripción:** proveedor configurable en Settings, endpoint estilo OpenAI
  `/audio/transcriptions` (base URL + key + modelo). Default para la demo: Whisper API.
  Compatible con un servidor Whisper local (MLX/whisper.cpp) sin tocar código.
- **Razonamiento:** proveedor configurable (default Anthropic). Dos modelos:
  - `MODEL_FAST` (Haiku) → momentos clave + tips en vivo.
  - `MODEL_STRONG` (Sonnet) → reporte final + retro estructurada.
- **Captura de audio:** `MediaRecorder` en el navegador, bloques de **10–15s** → route handler
  → proveedor de transcripción.
- **Diseño:** tokens de marca — Fraunces (headings), IBM Plex Sans/Mono (cuerpo/datos),
  paleta verde/café/papel. Aplícalos en la Fase 3.

### La línea de tiempo es la columna vertebral

Una sola estructura de datos alimenta tres features: (a) el timeline visible, (b) el panel de
momentos clave del debriefing, (c) el reporte final. Modélala una vez, reúsala tres veces:

```
TimelineSegment { id, sessionId, phase, startTs, endTs, transcriptText, kind: "speech"|"phase_marker"|"key_moment", meta }
```

---

## Configuración y secretos (repo PÚBLICO → cero fugas)

- **Settings page en la app** con placeholders para los dos proveedores (transcripción y
  razonamiento): base URL, API key, modelo(s). Se guarda en una tabla `settings` de SQLite local.
  Precedencia de lectura: **Settings (store local) → variable de entorno**. Así el martes las
  llaves se pegan en la UI, no en la terminal.
- En el repo solo va **`.env.example`** con placeholders vacíos. Nunca llaves reales.
- `.gitignore` **debe** excluir `.env`, `.env.*` (excepto `.env.example`), `*.db`, `/data`.
- Guardar llaves en SQLite sin cifrar es **demo-grade**; dilo en el README para que nadie lo
  copie a producción tal cual.

---

## Plan por fases (con criterios de aceptación auto-demostrables)

Cada criterio dice **cómo probarlo en el transcript**, porque el evaluador de `/goal` solo ve lo impreso.

### Fase 0 — Scaffold + repo público (~min 0–15)
- **Registra la hora de inicio** (`date`) en la primera línea de `PROGRESS.md`. La usarás cada
  turno para calcular el tiempo transcurrido y respetar el tope de ~2.1 h (126 min).
- `create-next-app` (TS, App Router, Tailwind), instala `better-sqlite3`, tokens mínimos.
- `gh repo create sim-copilot --public`, primer commit con `DEMO_BUILD.md`, `README.md` (MIT),
  `.env.example`, `.gitignore`.
- Crea el proyecto **dentro del directorio de proyectos que escanea m4-hub** y regístralo con un
  `project.yaml` mínimo en la raíz (name, slug, summary, host) con **`status: demo`** — **no**
  `live`/`wip`/`paused` ni ningún estado de proyecto activo o retirado. El yaml se commitea:
  **sin IPs ni topología interna** (el repo es público).
- **Probar (imprimir):** `gh repo view --json visibility,name` → PUBLIC; `git ls-files`
  incluye DEMO_BUILD.md/README/.env.example/.gitignore; `cat project.yaml` + curl al API local
  del hub mostrando el proyecto listado con `status: demo`; `npm run dev` levanta (curl a
  localhost → 200).

### Fase 1 — Flujo end-to-end en modo REPLAY (meta: verde ~min 75) ⭐ entregable seguro
- **Prep:** crear caso (título, descripción, texto del escenario) + objetivos de aprendizaje
  (lista). Guardar en SQLite. Lista de casos "listos para disparar".
- **Run:** elegir caso → iniciar sesión. Máquina de estados con botones que avanzan de fase;
  cada transición queda con timestamp y alimenta la timeline.
- **Ingesta en modo replay:** un transcript de ejemplo pre-cargado entra en chunks de 10–15s,
  etiquetados por la fase activa. La timeline se pinta en vivo.
- Persistencia de sesión + segmentos.
- **Probar (imprimir):** corre un end-to-end scripteado en replay; muestra el JSON de la timeline
  poblado a través de las fases; conteo de filas en DB; `npm run build` exit 0.

### Fase 2 — La magia IA (~min 75–110)
- **Momentos clave:** en `escenario → debriefing`, `MODEL_FAST` extrae momentos del transcript
  del escenario cruzados con los objetivos → pins en la timeline + panel de debriefing.
- **Debriefing estructurado (requisito del MVP):** al cerrar el escenario, genera un plan de
  debriefing estructurado anclado en un marco (PEARLS / advocacy-inquiry / plus-delta).
- **Tips en vivo:** durante el debriefing, llamadas periódicas a `MODEL_FAST` con prompts
  anclados en el marco, que el instructor usa o no.
- **Cierre:** `MODEL_STRONG` genera reporte + retro al instructor; se guarda y se exporta (md).
- **Probar (imprimir):** para una sesión replay, muestra la lista de momentos clave, un tip de
  ejemplo, el objeto de debriefing estructurado, y la ruta del reporte guardado (cat).

### Fase 3 — Mic real + Settings + pulido + assets de demo (~min 110–125, luego demo)
- Captura real con `MediaRecorder` (chunks) → proveedor de transcripción. **Toggle replay/live.**
- **Settings page** con los dos bloques de proveedor (placeholders), leyendo/escribiendo store local.
- Aplica tokens de diseño (Fraunces / IBM Plex / verde-café-papel).
- **Servidor de demo visible en la red:** deja el dev server corriendo con `-H 0.0.0.0` en el
  puerto **3000** (si está ocupado, 3010), para mostrar la app desde otra máquina de la
  red/tailnet. `DEMO.md` documenta el comando de arranque; la IP concreta de la máquina se
  imprime **solo en el transcript**, nunca en archivos del repo.
- `DEMO.md` (cómo correr la demo en vivo), README que invita a forkear, commits finales.
- **Probar (imprimir):** Settings lee/escribe llaves; toggle funciona; curl a la app usando la
  IP de la máquina en la tailnet → 200 (imprime la URL de demo); `gh repo view` final;
  `PROGRESS.md` completo; build en verde.

---

## Guardrails (críticos para desatendido + repo público)

- **Nunca commitees secretos.** Antes de cada commit, verifica que `.gitignore` cubra `.env*`,
  `*.db`, `/data`. Si un commit fuera a incluir un secreto, **aborta ese commit y regístralo**.
- **No-interactivo siempre.** Asume `gh` autenticado y llaves en `.env.local`. Nunca te quedes
  esperando un prompt interactivo. Ante cualquier bloqueo: **regístralo en `PROGRESS.md` y sigue
  por el fallback documentado.**
- **Protege lo seguro.** Si vas retrasado, resguarda el end-to-end en replay de la Fase 1 por
  encima del pulido de Fases 2–3.
- **Visibilidad.** Después de **cada turno**, actualiza `PROGRESS.md` (fase actual, criterios
  cumplidos, siguiente paso, bloqueos) y haz `cat` de él — para que JuanMa lo lea en los recesos
  y el evaluador vea el avance.
- **Idempotencia.** Todo re-ejecutable: revisa si el repo ya existe antes de crearlo; init de DB
  seguro de repetir.

---

## La condición `/goal` (esto es lo que se dispara en clase)

Cópiala como una sola línea después de `/goal` (aquí va indentada solo para leerla):

```
/goal Construye el "Sim Copilot MVP" ejecutando el plan por fases de ./DEMO_BUILD.md.
LISTO cuando TODO esto quede demostrado en el transcript de esta conversación:
(1) existe un repo PÚBLICO de GitHub con DEMO_BUILD.md, README (MIT), .env.example y un
.gitignore que excluye .env* y *.db — pruébalo con `gh repo view --json visibility,name` y
`git ls-files`; (2) `npm run build` sale 0 — muestra el exit code; (3) el flujo end-to-end
funciona en modo REPLAY a través de prep→prebriefing→escenario→debriefing→reporte con la
timeline poblada — muestra el JSON de la timeline y el conteo de filas en DB; (4) al cerrar el
escenario la app genera un debriefing estructurado, y al cerrar el debriefing un archivo de
reporte + retro al instructor — haz cat de ambos; (5) hay una Settings page con campos de
proveedor de transcripción y de razonamiento (base URL/key/modelo) que lee del store local con
fallback a env; (6) el proyecto quedó registrado en m4-hub con `status: demo` en su project.yaml
—no un estado de proyecto activo ni retirado— pruébalo con cat de project.yaml y un curl al API
local del hub que muestre el proyecto listado con status "demo"; (7) el dev server queda corriendo
accesible desde la tailnet (`-H 0.0.0.0`, puerto 3000 o 3010) — muestra un curl → 200 usando la IP
de esta máquina en la tailnet e imprime la URL de demo (la IP va solo en el transcript, nunca en
archivos del repo). Después de CADA turno: actualiza ./PROGRESS.md y haz cat.
NUNCA commitees secretos; si un commit fuera a incluir uno, aborta y regístralo. Asume gh
autenticado y llaves en .env.local; nunca esperes prompts interactivos — ante cualquier bloqueo,
regístralo en PROGRESS.md y sigue por el fallback, protegiendo el end-to-end replay de la Fase 1
por encima del pulido posterior. En la Fase 0 registra la hora de inicio en PROGRESS.md; en cada
turno calcula el tiempo transcurrido con `date` e imprímelo. Detente al llegar a ~126 min (~2.1 h)
de inicio a demo si no se cumple todo, dejando el flujo replay de la Fase 1 en verde como
entregable mínimo y PROGRESS.md con lo que falta.
```

> El build está topado a **~2.1 h (126 min) de inicio a demo**; ajusta ese número en la condición
> si cambia la duración de la clase. El nombre del repo (`sim-copilot`) se cambia en un solo lugar
> aquí y en la Fase 0.

---

## Anatomía de este prompt (para los alumnos)

Un buen prompt de Claude Code para trabajo autónomo tiene: **objetivo** claro, **contexto** y
**stack** fijos (menos ambigüedad = menos deriva), un **plan por fases** que entrega valor
temprano, **criterios de aceptación** que se pueden *probar*, **guardrails** para lo que no debe
pasar, y **fallbacks** para no detenerse ante un bloqueo. La condición `/goal` es el "done"
verificable; este archivo es el "cómo". El worker lee ambos; el evaluador solo el transcript.
