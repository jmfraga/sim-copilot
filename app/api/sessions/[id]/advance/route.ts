import { db, nowTs } from "@/lib/db";
import { nextPhase, PHASE_LABELS, type Phase } from "@/lib/phases";
import { generateDebriefPlan, generateKeyMoments, generateReport } from "@/lib/generators";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = db.prepare("SELECT id, phase FROM sessions WHERE id = ?").get(id) as
    | { id: number; phase: string }
    | undefined;
  if (!session) return NextResponse.json({ error: "sesión no existe" }, { status: 404 });

  const next = nextPhase(session.phase);
  if (!next)
    return NextResponse.json({ error: `no hay fase después de '${session.phase}'` }, { status: 409 });

  const ts = nowTs();
  db.prepare("UPDATE sessions SET phase = ?, ended_at = CASE WHEN ? = 'reporte' THEN datetime('now','localtime') ELSE ended_at END WHERE id = ?")
    .run(next, next, id);
  db.prepare(
    `INSERT INTO timeline_segments(session_id, phase, start_ts, kind, transcript_text, meta)
     VALUES(?, ?, ?, 'phase_marker', ?, ?)`
  ).run(id, next, ts, `Transición a ${PHASE_LABELS[next as Phase]}`, JSON.stringify({ from: session.phase }));

  // La magia IA se dispara en las transiciones; best-effort: la máquina de
  // estados nunca se bloquea por una falla del proveedor.
  const warnings: string[] = [];
  if (next === "debriefing") {
    await Promise.all([
      generateKeyMoments(id).catch((e) => warnings.push(`key_moments: ${e.message}`)),
      generateDebriefPlan(id).catch((e) => warnings.push(`debrief_plan: ${e.message}`)),
    ]);
  } else if (next === "reporte") {
    await generateReport(id).catch((e) => warnings.push(`report: ${e.message}`));
  }
  if (warnings.length) {
    db.prepare("INSERT INTO artifacts(session_id, kind, content) VALUES(?, 'error', ?)")
      .run(id, warnings.join(" | "));
  }

  return NextResponse.json({ id: Number(id), phase: next, transitionedAt: ts, warnings });
}
