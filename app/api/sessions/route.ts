import { db, nowTs } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sessions = db
    .prepare(
      `SELECT s.*, c.title AS case_title FROM sessions s
       JOIN cases c ON c.id = s.case_id ORDER BY s.id DESC`
    )
    .all();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const { caseId, mode = "replay" } = await request.json();
  const kase = db.prepare("SELECT id FROM cases WHERE id = ?").get(caseId);
  if (!kase) return NextResponse.json({ error: "caso no existe" }, { status: 404 });

  const { lastInsertRowid: id } = db
    .prepare("INSERT INTO sessions(case_id, mode, phase) VALUES(?, ?, 'prep')")
    .run(caseId, mode);
  db.prepare(
    `INSERT INTO timeline_segments(session_id, phase, start_ts, kind, transcript_text, meta)
     VALUES(?, 'prep', ?, 'phase_marker', 'Inicio de sesión (prep)', '{}')`
  ).run(id, nowTs());
  return NextResponse.json({ id }, { status: 201 });
}
