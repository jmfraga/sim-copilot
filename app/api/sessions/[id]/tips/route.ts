import { db } from "@/lib/db";
import { generateTip } from "@/lib/generators";
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
  if (session.phase !== "debriefing")
    return NextResponse.json({ error: "los tips solo aplican en debriefing" }, { status: 409 });

  try {
    const tip = await generateTip(id);
    return NextResponse.json({ tip }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
