"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";

const PHASES = ["prep", "prebriefing", "escenario", "debriefing", "reporte"] as const;
const PHASE_LABELS: Record<string, string> = {
  prep: "Preparación", prebriefing: "Prebriefing", escenario: "Escenario",
  debriefing: "Debriefing", reporte: "Reporte",
};
const PHASE_COLORS: Record<string, string> = {
  prep: "bg-stone-400", prebriefing: "bg-cafe", escenario: "bg-accent",
  debriefing: "bg-sky-700", reporte: "bg-stone-700",
};

type Segment = {
  id: number; phase: string; start_ts: string; end_ts: string | null;
  transcript_text: string; kind: string; meta: string;
};
type Artifact = { id: number; kind: string; content: string; created_at: string };
type SessionData = {
  session: { id: number; phase: string; mode: string; case_title: string; case_description: string };
  objectives: { id: number; text: string }[];
  timeline: Segment[];
  artifacts: Artifact[];
};
type Chunk = { phase: string; text: string; secs: number };

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SessionData | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [replayIdx, setReplayIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const d = await fetch(`/api/sessions/${id}`).then((r) => r.json());
    setData(d);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/replay/sample").then((r) => r.json()).then((d) => setChunks(d.chunks));
  }, []);

  // reproductor replay: manda el siguiente chunk si su fase coincide con la fase activa
  useEffect(() => {
    if (!playing || !data || replayIdx >= chunks.length) return;
    const chunk = chunks[replayIdx];
    if (chunk.phase !== data.session.phase) return; // espera a que el instructor avance de fase
    const t = setTimeout(async () => {
      await fetch(`/api/sessions/${id}/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: chunk.text, secs: chunk.secs }),
      });
      setReplayIdx((i) => i + 1);
      load();
    }, 1500);
    return () => clearTimeout(t);
  }, [playing, replayIdx, chunks, data, id, load]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.timeline.length]);

  // tips en vivo: cada 25 s durante el debriefing
  const inDebrief = data?.session.phase === "debriefing";
  useEffect(() => {
    if (!inDebrief) return;
    const ask = () => fetch(`/api/sessions/${id}/tips`, { method: "POST" }).catch(() => {});
    const t = setInterval(ask, 25000);
    ask();
    return () => clearInterval(t);
  }, [inDebrief, id]);

  if (!data) return <main className="p-8">Cargando…</main>;
  const { session, objectives, timeline, artifacts } = data;
  const phaseIdx = PHASES.indexOf(session.phase as (typeof PHASES)[number]);
  const nextPhase = phaseIdx >= 0 && phaseIdx < PHASES.length - 1 ? PHASES[phaseIdx + 1] : null;
  const keyMoments = timeline.filter((s) => s.kind === "key_moment");
  const debriefPlan = artifacts.filter((a) => a.kind === "debrief_plan").at(-1);
  const report = artifacts.filter((a) => a.kind === "report").at(-1);
  const tips = artifacts.filter((a) => a.kind === "tip");
  const waitingPhase = playing && replayIdx < chunks.length && chunks[replayIdx].phase !== session.phase;

  async function advance() {
    setAdvancing(true);
    await fetch(`/api/sessions/${id}/advance`, { method: "POST" });
    await load();
    setAdvancing(false);
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <a href="/" className="text-xs underline opacity-60">← casos</a>
          <h1 className="font-heading text-3xl font-semibold">{session.case_title}</h1>
          <p className="text-sm opacity-70">Sesión #{session.id} · modo {session.mode}</p>
        </div>
        {session.mode === "replay" && session.phase !== "reporte" && (
          <div className="text-right">
            <button
              onClick={() => setPlaying((p) => !p)}
              className={`rounded-md px-4 py-2 text-sm text-white ${playing ? "bg-cafe" : "bg-accent"}`}
            >
              {playing ? "⏸ Pausar replay" : "▶ Iniciar replay"}
            </button>
            {waitingPhase && (
              <p className="text-xs mt-1 opacity-70">
                replay en espera: el siguiente fragmento es de «{PHASE_LABELS[chunks[replayIdx].phase]}»
              </p>
            )}
          </div>
        )}
      </header>

      {/* Máquina de estados */}
      <section className="rounded-lg border border-line bg-panel p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {PHASES.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  i < phaseIdx ? "bg-stone-200 text-stone-500"
                  : i === phaseIdx ? `${PHASE_COLORS[p]} text-white font-medium`
                  : "border border-line opacity-60"
                }`}
              >
                {PHASE_LABELS[p]}
              </span>
              {i < PHASES.length - 1 && <span className="opacity-40">→</span>}
            </div>
          ))}
          {nextPhase && (
            <button
              onClick={advance}
              disabled={advancing}
              className="ml-auto rounded-md bg-ink px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {advancing ? "…" : `Avanzar a ${PHASE_LABELS[nextPhase]} →`}
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Timeline */}
        <section className="rounded-lg border border-line bg-panel p-4">
          <h2 className="font-heading text-xl mb-3">Línea de tiempo</h2>
          <div className="max-h-[520px] overflow-y-auto space-y-2 pr-2">
            {timeline.map((seg) =>
              seg.kind === "phase_marker" ? (
                <div key={seg.id} className="flex items-center gap-2 py-1">
                  <span className={`h-2 w-2 rounded-full ${PHASE_COLORS[seg.phase]}`} />
                  <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                    {seg.transcript_text}
                  </span>
                  <span className="text-xs opacity-40 font-mono">{seg.start_ts.slice(11, 19)}</span>
                </div>
              ) : seg.kind === "key_moment" ? (
                <div key={seg.id} className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-2 text-sm">
                  <span className="mr-1">📌</span>
                  {seg.transcript_text}
                </div>
              ) : (
                <div key={seg.id} className="flex gap-2 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PHASE_COLORS[seg.phase]}`} />
                  <p className="opacity-90">{seg.transcript_text}</p>
                </div>
              )
            )}
            <div ref={timelineEndRef} />
          </div>
        </section>

        {/* Panel lateral */}
        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-panel p-4">
            <h3 className="font-heading text-lg mb-2">Objetivos de aprendizaje</h3>
            <ol className="list-decimal ml-4 space-y-1 text-sm opacity-90">
              {objectives.map((o) => <li key={o.id}>{o.text}</li>)}
            </ol>
          </section>

          {keyMoments.length > 0 && (
            <section className="rounded-lg border border-line bg-panel p-4">
              <h3 className="font-heading text-lg mb-2">📌 Momentos clave</h3>
              <ul className="space-y-2 text-sm">
                {keyMoments.map((m) => <li key={m.id} className="border-l-2 border-amber-500 pl-2">{m.transcript_text}</li>)}
              </ul>
            </section>
          )}

          {session.phase === "debriefing" && tips.length > 0 && (
            <section className="rounded-lg border border-accent bg-panel p-4">
              <h3 className="font-heading text-lg mb-2">💡 Tips en vivo</h3>
              <ul className="space-y-2 text-sm">
                {tips.slice(-3).map((t) => <li key={t.id}>{t.content}</li>)}
              </ul>
            </section>
          )}

          {debriefPlan && (
            <section className="rounded-lg border border-line bg-panel p-4">
              <h3 className="font-heading text-lg mb-2">🧭 Plan de debriefing</h3>
              <pre className="whitespace-pre-wrap text-xs font-mono opacity-90 max-h-64 overflow-y-auto">{debriefPlan.content}</pre>
            </section>
          )}

          {report && (
            <section className="rounded-lg border border-cafe bg-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading text-lg">📄 Reporte final</h3>
                <a href={`/api/sessions/${id}/report`} className="text-xs underline text-accent">
                  ⬇ Exportar .md
                </a>
              </div>
              <pre className="whitespace-pre-wrap text-xs font-mono opacity-90 max-h-64 overflow-y-auto">{report.content}</pre>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
