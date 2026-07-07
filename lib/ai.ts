import { getConfig } from "./config";

/** Llamada mínima al API de Anthropic (compatible con proxies del mismo formato). */
export async function callClaude(opts: {
  model: "fast" | "strong";
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const baseUrl = getConfig("reasoning.base_url", "REASONING_BASE_URL", "https://api.anthropic.com");
  const apiKey = getConfig("reasoning.api_key", "ANTHROPIC_API_KEY");
  const model =
    opts.model === "fast"
      ? getConfig("reasoning.model_fast", "MODEL_FAST", "claude-haiku-4-5-20251001")
      : getConfig("reasoning.model_strong", "MODEL_STRONG", "claude-sonnet-4-6");
  if (!apiKey) throw new Error("Falta API key de razonamiento (Settings o ANTHROPIC_API_KEY)");

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1500,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  return (body.content?.[0]?.text as string) ?? "";
}

/** Extrae el primer bloque JSON de una respuesta (tolera fences). */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[[{]/);
  if (start < 0) throw new Error("sin JSON en la respuesta");
  return JSON.parse(raw.slice(start).trim()) as T;
}
