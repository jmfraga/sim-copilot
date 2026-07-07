"use client";

import { useCallback, useEffect, useState } from "react";

type Setting = {
  key: string; label: string; group: string; secret: boolean;
  source: "settings" | "env" | "default"; value: string;
};

const GROUP_TITLES: Record<string, string> = {
  transcription: "Proveedor de transcripción",
  reasoning: "Proveedor de razonamiento",
};
const SOURCE_LABELS: Record<string, string> = {
  settings: "guardado aquí", env: "variable de entorno", default: "default",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setSettings(await fetch("/api/settings").then((r) => r.json()));
    setEdits({});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { saved } = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ values: edits }),
    }).then((r) => r.json());
    setMsg(`${saved} valores procesados`);
    load();
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-8 space-y-8">
      <header>
        <a href="/" className="text-xs underline opacity-60">← inicio</a>
        <h1 className="font-heading text-3xl font-semibold">Settings</h1>
        <p className="text-sm opacity-70 mt-1">
          Precedencia: lo guardado aquí (SQLite local) → variable de entorno → default.
          ⚠️ Demo-grade: las llaves se guardan sin cifrar; no copies este patrón a producción.
        </p>
      </header>

      <form onSubmit={save} className="space-y-6">
        {["transcription", "reasoning"].map((group) => (
          <section key={group} className="rounded-lg border border-line bg-panel p-4">
            <h2 className="font-heading text-xl mb-3">{GROUP_TITLES[group]}</h2>
            <div className="grid gap-3">
              {settings.filter((s) => s.group === group).map((s) => (
                <label key={s.key} className="grid gap-1">
                  <span className="text-sm font-medium">
                    {s.label}
                    <span className="ml-2 text-xs font-normal opacity-60">({SOURCE_LABELS[s.source]})</span>
                  </span>
                  <input
                    type={s.secret ? "password" : "text"}
                    placeholder={s.value || `(sin ${s.label.toLowerCase()})`}
                    value={edits[s.key] ?? ""}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [s.key]: e.target.value }))}
                    className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
        <div className="flex items-center gap-3">
          <button className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90">
            Guardar
          </button>
          {msg && <span className="text-sm opacity-70">{msg}</span>}
        </div>
      </form>
    </main>
  );
}
