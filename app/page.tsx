"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Case = { id: number; title: string; description: string; objective_count: number };
type Session = { id: number; case_title: string; phase: string; mode: string; started_at: string };

export default function Home() {
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scenarioText, setScenarioText] = useState("");
  const [objectives, setObjectives] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      fetch("/api/cases").then((r) => r.json()),
      fetch("/api/sessions").then((r) => r.json()),
    ]);
    setCases(c);
    setSessions(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createCase(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        scenarioText,
        objectives: objectives.split("\n").filter(Boolean),
      }),
    });
    setTitle(""); setDescription(""); setScenarioText(""); setObjectives("");
    setBusy(false);
    load();
  }

  async function loadSampleCase() {
    setBusy(true);
    const { case: c } = await fetch("/api/replay/sample").then((r) => r.json());
    await fetch("/api/cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: c.title,
        description: c.description,
        scenarioText: c.scenarioText,
        objectives: c.objectives,
      }),
    });
    setBusy(false);
    load();
  }

  async function startSession(caseId: number, mode: string) {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseId, mode }),
    });
    const { id } = await res.json();
    router.push(`/session/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-8 space-y-10">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-heading text-4xl font-semibold">Sim Copilot</h1>
          <p className="text-sm opacity-70 mt-1">
            Copiloto de simulación clínica — demo construida de forma autónoma por Claude Code
          </p>
        </div>
        <a href="/settings" className="text-sm underline opacity-70 hover:opacity-100">⚙ Settings</a>
      </header>

      <section>
        <h2 className="font-heading text-2xl mb-3">Casos listos para disparar</h2>
        {cases.length === 0 && (
          <p className="text-sm opacity-70 mb-3">
            No hay casos aún.{" "}
            <button onClick={loadSampleCase} disabled={busy} className="underline text-accent">
              Cargar caso de ejemplo (dolor torácico → FV)
            </button>
          </p>
        )}
        <ul className="space-y-2">
          {cases.map((c) => (
            <li key={c.id} className="rounded-lg border border-line bg-panel p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-sm opacity-70">
                  {c.description || "—"} · {c.objective_count} objetivos
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => startSession(c.id, "replay")}
                  className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
                >
                  ▶ Sesión replay
                </button>
                <button
                  onClick={() => startSession(c.id, "live")}
                  className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-black/5"
                >
                  🎙 Sesión live
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-2xl mb-3">Nuevo caso</h2>
        <form onSubmit={createCase} className="grid gap-3 rounded-lg border border-line bg-panel p-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del caso"
            className="rounded-md border border-line bg-paper px-3 py-2" required />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve"
            className="rounded-md border border-line bg-paper px-3 py-2" />
          <textarea value={scenarioText} onChange={(e) => setScenarioText(e.target.value)} rows={3}
            placeholder="Texto del escenario (guion, estado inicial, evolución esperada)"
            className="rounded-md border border-line bg-paper px-3 py-2" />
          <textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={3}
            placeholder="Objetivos de aprendizaje (uno por línea)"
            className="rounded-md border border-line bg-paper px-3 py-2" />
          <button disabled={busy}
            className="justify-self-start rounded-md bg-cafe px-4 py-2 text-sm text-white hover:opacity-90">
            Guardar caso
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-heading text-2xl mb-3">Sesiones</h2>
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li key={s.id}>
              <a href={`/session/${s.id}`} className="text-sm underline">
                #{s.id} · {s.case_title} · fase: {s.phase} · {s.mode} · {s.started_at}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
