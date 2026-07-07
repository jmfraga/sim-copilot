import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const cases = db
    .prepare(
      `SELECT c.*, COUNT(o.id) AS objective_count
       FROM cases c LEFT JOIN objectives o ON o.case_id = c.id
       GROUP BY c.id ORDER BY c.id DESC`
    )
    .all();
  return NextResponse.json(cases);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description = "", scenarioText = "", objectives = [] } = body;
  if (!title) return NextResponse.json({ error: "title requerido" }, { status: 400 });

  const insertCase = db.prepare(
    "INSERT INTO cases(title, description, scenario_text) VALUES(?, ?, ?)"
  );
  const insertObj = db.prepare(
    "INSERT INTO objectives(case_id, ord, text) VALUES(?, ?, ?)"
  );
  const tx = db.transaction(() => {
    const { lastInsertRowid } = insertCase.run(title, description, scenarioText);
    (objectives as string[]).forEach((text, i) => {
      if (text.trim()) insertObj.run(lastInsertRowid, i, text.trim());
    });
    return lastInsertRowid;
  });
  const id = tx();
  return NextResponse.json({ id }, { status: 201 });
}
