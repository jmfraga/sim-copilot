import fs from "node:fs";
import path from "node:path";
import { db, nowTs } from "./db";
import { callClaude, extractJson } from "./ai";

function getSessionContext(sessionId: number | string) {
  const session = db
    .prepare(
      `SELECT s.*, c.title, c.description, c.scenario_text FROM sessions s
       JOIN cases c ON c.id = s.case_id WHERE s.id = ?`
    )
    .get(sessionId) as Record<string, string> & { case_id: number };
  const objectives = (
    db.prepare("SELECT text FROM objectives WHERE case_id = ? ORDER BY ord").all(session.case_id) as { text: string }[]
  ).map((o, i) => `${i + 1}. ${o.text}`);
  const speech = (phase: string) =>
    (
      db.prepare(
        "SELECT transcript_text FROM timeline_segments WHERE session_id = ? AND phase = ? AND kind = 'speech' ORDER BY id"
      ).all(sessionId, phase) as { transcript_text: string }[]
    ).map((s) => s.transcript_text);
  return { session, objectives, speech };
}

/** escenario → debriefing: momentos clave cruzados con objetivos (MODEL_FAST). */
export async function generateKeyMoments(sessionId: number | string) {
  const { session, objectives, speech } = getSessionContext(sessionId);
  const text = await callClaude({
    model: "fast",
    maxTokens: 1200,
    system:
      "Eres copiloto de un instructor de simulación clínica. Extraes momentos clave de un escenario para el debriefing. Respondes SOLO JSON.",
    user: `Caso: ${session.title}\n${session.scenario_text}\n\nObjetivos de aprendizaje:\n${objectives.join("\n")}\n\nTranscript del escenario (fragmentos en orden):\n${speech("escenario").join("\n")}\n\nDevuelve JSON: [{"title": "...", "detail": "qué pasó y por qué importa (1-2 frases)", "objective": <número del objetivo relacionado o null>}] con los 4-6 momentos más relevantes para el debriefing.`,
  });
  const moments = extractJson<{ title: string; detail: string; objective: number | null }[]>(text);
  const insert = db.prepare(
    `INSERT INTO timeline_segments(session_id, phase, start_ts, kind, transcript_text, meta)
     VALUES(?, 'escenario', ?, 'key_moment', ?, ?)`
  );
  for (const m of moments) {
    insert.run(sessionId, nowTs(), `${m.title} — ${m.detail}`, JSON.stringify({ objective: m.objective }));
  }
  return moments;
}

/** escenario → debriefing: plan de debriefing estructurado PEARLS (MODEL_FAST). */
export async function generateDebriefPlan(sessionId: number | string) {
  const { session, objectives, speech } = getSessionContext(sessionId);
  const content = await callClaude({
    model: "fast",
    maxTokens: 1800,
    system:
      "Eres copiloto de un instructor de simulación clínica experto en debriefing con el marco PEARLS (reacciones → descripción → análisis con advocacy-inquiry y plus-delta → resumen/aplicación).",
    user: `Caso: ${session.title}\n\nObjetivos:\n${objectives.join("\n")}\n\nTranscript del escenario:\n${speech("escenario").join("\n")}\n\nGenera un plan de debriefing estructurado en markdown con: 1) Apertura de reacciones (pregunta sugerida), 2) Fase descriptiva (pregunta), 3) Análisis por objetivo con al menos 2 preguntas advocacy-inquiry concretas citando lo observado, 4) Plus-delta sugerido, 5) Cierre con puntos de resumen. Máximo ~400 palabras, listo para que el instructor lo use en vivo.`,
  });
  db.prepare("INSERT INTO artifacts(session_id, kind, content) VALUES(?, 'debrief_plan', ?)").run(sessionId, content);
  return content;
}

/** Durante debriefing: un tip breve para el instructor (MODEL_FAST). */
export async function generateTip(sessionId: number | string) {
  const { session, objectives, speech } = getSessionContext(sessionId);
  const recent = speech("debriefing").slice(-6);
  const content = await callClaude({
    model: "fast",
    maxTokens: 250,
    system:
      "Eres copiloto silencioso de un instructor durante un debriefing PEARLS. Das UN tip breve (máx 2 frases), accionable y anclado en lo que se acaba de decir. Sin preámbulo.",
    user: `Caso: ${session.title}\nObjetivos:\n${objectives.join("\n")}\n\nÚltimos fragmentos del debriefing:\n${recent.join("\n") || "(aún no hay conversación)"}\n\nDame un solo tip para el instructor ahora mismo.`,
  });
  db.prepare("INSERT INTO artifacts(session_id, kind, content) VALUES(?, 'tip', ?)").run(sessionId, content);
  return content;
}

/** debriefing → reporte: reporte final + retro al instructor (MODEL_STRONG), guardado y exportable. */
export async function generateReport(sessionId: number | string) {
  const { session, objectives, speech } = getSessionContext(sessionId);
  const keyMoments = (
    db.prepare(
      "SELECT transcript_text FROM timeline_segments WHERE session_id = ? AND kind = 'key_moment' ORDER BY id"
    ).all(sessionId) as { transcript_text: string }[]
  ).map((k) => `- ${k.transcript_text}`);
  const content = await callClaude({
    model: "strong",
    maxTokens: 3000,
    system:
      "Eres copiloto experto en educación por simulación clínica. Redactas reportes de sesión rigurosos y retroalimentación formativa al instructor (estilo DASH), en markdown, en español.",
    user: `Caso: ${session.title}\n${session.description}\n\nObjetivos:\n${objectives.join("\n")}\n\nMomentos clave detectados:\n${keyMoments.join("\n")}\n\nTranscript escenario:\n${speech("escenario").join("\n")}\n\nTranscript debriefing:\n${speech("debriefing").join("\n")}\n\nGenera: # Reporte de sesión (resumen del caso, desempeño observado por objetivo, momentos clave y su análisis, acuerdos/plan de acción del equipo) y después # Retroalimentación al instructor (qué hizo bien en el debriefing con ejemplos citados, qué puede mejorar, 2-3 sugerencias concretas). Markdown limpio.`,
  });
  db.prepare("INSERT INTO artifacts(session_id, kind, content) VALUES(?, 'report', ?)").run(sessionId, content);
  const dir = path.join(process.cwd(), "data", "reports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `session-${sessionId}-reporte.md`);
  fs.writeFileSync(file, content);
  return { content, file };
}
