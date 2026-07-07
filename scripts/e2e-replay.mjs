/**
 * E2E scripteado del flujo REPLAY:
 * crea caso → sesión → avanza prep→prebriefing→escenario→debriefing→reporte
 * ingiriendo los chunks del transcript de ejemplo en la fase que les toca.
 * Imprime el JSON de la timeline al final.
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

const { case: sampleCase, chunks } = await api("/api/replay/sample");

const { id: caseId } = await api("/api/cases", {
  method: "POST",
  body: JSON.stringify({
    title: sampleCase.title,
    description: sampleCase.description,
    scenarioText: sampleCase.scenarioText,
    objectives: sampleCase.objectives,
  }),
});
console.log(`caso creado id=${caseId}`);

const { id: sessionId } = await api("/api/sessions", {
  method: "POST",
  body: JSON.stringify({ caseId, mode: "replay" }),
});
console.log(`sesión creada id=${sessionId} (fase inicial: prep)`);

const order = ["prebriefing", "escenario", "debriefing", "reporte"];
for (const phase of order) {
  const r = await api(`/api/sessions/${sessionId}/advance`, { method: "POST" });
  console.log(`→ avanzado a: ${r.phase}`);
  for (const chunk of chunks.filter((c) => c.phase === phase)) {
    await api(`/api/sessions/${sessionId}/ingest`, {
      method: "POST",
      body: JSON.stringify({ text: chunk.text, secs: chunk.secs }),
    });
  }
}

const { session, timeline } = await api(`/api/sessions/${sessionId}`);
console.log(`\nfase final de la sesión: ${session.phase}`);
const byPhase = {};
for (const seg of timeline) byPhase[seg.phase] = (byPhase[seg.phase] || 0) + 1;
console.log("segmentos por fase:", JSON.stringify(byPhase));
console.log(`total segmentos timeline: ${timeline.length}`);
console.log("\n=== TIMELINE JSON (primeros 6 + últimos 2 segmentos) ===");
const shown = [...timeline.slice(0, 6), ...timeline.slice(-2)];
console.log(JSON.stringify(shown, null, 1));
console.log(`SESSION_ID=${sessionId}`);
