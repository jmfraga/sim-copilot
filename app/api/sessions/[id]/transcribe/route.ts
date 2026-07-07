import { db, nowTs } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = db.prepare("SELECT id, phase FROM sessions WHERE id = ?").get(id) as
    | { id: number; phase: string }
    | undefined;
  if (!session) return NextResponse.json({ error: "sesión no existe" }, { status: 404 });

  const baseUrl = getConfig("transcription.base_url", "TRANSCRIPTION_BASE_URL", "https://api.openai.com/v1");
  const apiKey = getConfig("transcription.api_key", "OPENAI_API_KEY");
  const model = getConfig("transcription.model", "TRANSCRIPTION_MODEL", "whisper-1");
  if (!apiKey)
    return NextResponse.json({ error: "Falta API key de transcripción (Settings u OPENAI_API_KEY)" }, { status: 400 });

  const incoming = await request.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof File))
    return NextResponse.json({ error: "campo 'audio' (File) requerido" }, { status: 400 });

  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "chunk.webm");
  upstream.append("model", model);
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: upstream,
  });
  const body = await res.json();
  if (!res.ok)
    return NextResponse.json({ error: `proveedor ${res.status}: ${JSON.stringify(body).slice(0, 200)}` }, { status: 502 });

  const text = (body.text as string)?.trim();
  if (!text) return NextResponse.json({ skipped: "chunk sin voz" });

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO timeline_segments(session_id, phase, start_ts, transcript_text, kind, meta)
       VALUES(?, ?, ?, ?, 'speech', '{"source":"mic"}')`
    )
    .run(id, session.phase, nowTs(), text);
  return NextResponse.json({ id: Number(lastInsertRowid), text, phase: session.phase }, { status: 201 });
}
