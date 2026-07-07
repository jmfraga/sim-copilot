import { db } from "./db";

/** Precedencia: settings (SQLite local) → variable de entorno → default. */
export function getConfig(key: string, envVar: string, fallback = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (row?.value) return row.value;
  return process.env[envVar] || fallback;
}

export function setConfig(key: string, value: string): void {
  db.prepare(
    "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

export const CONFIG_KEYS = [
  { key: "reasoning.base_url", env: "REASONING_BASE_URL", label: "Base URL", group: "reasoning", secret: false, default: "https://api.anthropic.com" },
  { key: "reasoning.api_key", env: "ANTHROPIC_API_KEY", label: "API Key", group: "reasoning", secret: true, default: "" },
  { key: "reasoning.model_fast", env: "MODEL_FAST", label: "Modelo rápido", group: "reasoning", secret: false, default: "claude-haiku-4-5-20251001" },
  { key: "reasoning.model_strong", env: "MODEL_STRONG", label: "Modelo fuerte", group: "reasoning", secret: false, default: "claude-sonnet-4-6" },
  { key: "transcription.base_url", env: "TRANSCRIPTION_BASE_URL", label: "Base URL", group: "transcription", secret: false, default: "https://api.openai.com/v1" },
  { key: "transcription.api_key", env: "OPENAI_API_KEY", label: "API Key", group: "transcription", secret: true, default: "" },
  { key: "transcription.model", env: "TRANSCRIPTION_MODEL", label: "Modelo", group: "transcription", secret: false, default: "whisper-1" },
] as const;
