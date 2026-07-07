import { db, nowTs } from "@/lib/db";
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

  const { text, startTs, endTs, secs } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: "text requerido" }, { status: 400 });

  const start = startTs || nowTs();
  const end = endTs || (secs ? new Date(Date.parse(start) + secs * 1000).toISOString() : null);
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO timeline_segments(session_id, phase, start_ts, end_ts, transcript_text, kind, meta)
       VALUES(?, ?, ?, ?, ?, 'speech', '{}')`
    )
    .run(id, session.phase, start, end, text.trim());
  return NextResponse.json({ id: Number(lastInsertRowid), phase: session.phase }, { status: 201 });
}
