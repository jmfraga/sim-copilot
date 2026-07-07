import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = db
    .prepare(
      "SELECT content FROM artifacts WHERE session_id = ? AND kind = 'report' ORDER BY id DESC LIMIT 1"
    )
    .get(id) as { content: string } | undefined;
  if (!report) return NextResponse.json({ error: "aún no hay reporte" }, { status: 404 });
  return new NextResponse(report.content, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="session-${id}-reporte.md"`,
    },
  });
}
