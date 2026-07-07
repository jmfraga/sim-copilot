import { db } from "@/lib/db";
import { CONFIG_KEYS, setConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out = CONFIG_KEYS.map((k) => {
    const fromStore = stored.get(k.key);
    const fromEnv = process.env[k.env];
    const source = fromStore ? "settings" : fromEnv ? "env" : "default";
    const value = fromStore ?? fromEnv ?? k.default;
    return {
      key: k.key,
      label: k.label,
      group: k.group,
      secret: k.secret,
      source,
      value: k.secret && value ? `••••${value.slice(-4)}` : value,
    };
  });
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const { values } = (await request.json()) as { values: Record<string, string> };
  const valid = new Set<string>(CONFIG_KEYS.map((k) => k.key));
  let saved = 0;
  for (const [key, value] of Object.entries(values || {})) {
    if (!valid.has(key)) continue;
    if (value === "") {
      db.prepare("DELETE FROM settings WHERE key = ?").run(key);
    } else if (!value.startsWith("••••")) {
      setConfig(key, value);
    }
    saved++;
  }
  return NextResponse.json({ saved });
}
