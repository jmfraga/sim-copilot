import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = db
    .prepare(
      `SELECT s.*, c.title AS case_title, c.description AS case_description,
              c.scenario_text AS scenario_text
       FROM sessions s JOIN cases c ON c.id = s.case_id WHERE s.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!session) return NextResponse.json({ error: "sesión no existe" }, { status: 404 });

  const objectives = db
    .prepare("SELECT id, ord, text FROM objectives WHERE case_id = ? ORDER BY ord")
    .all(session.case_id);
  const timeline = db
    .prepare("SELECT * FROM timeline_segments WHERE session_id = ? ORDER BY id")
    .all(id);
  const artifacts = db
    .prepare("SELECT id, kind, content, created_at FROM artifacts WHERE session_id = ? ORDER BY id")
    .all(id);
  return NextResponse.json({ session, objectives, timeline, artifacts });
}
