export const PHASES = ["prep", "prebriefing", "escenario", "debriefing", "reporte"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  prep: "Preparación",
  prebriefing: "Prebriefing",
  escenario: "Escenario",
  debriefing: "Debriefing",
  reporte: "Reporte",
};

export function nextPhase(current: string): Phase | null {
  const i = PHASES.indexOf(current as Phase);
  if (i < 0 || i >= PHASES.length - 1) return null;
  return PHASES[i + 1];
}
