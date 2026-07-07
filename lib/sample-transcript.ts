/**
 * Transcript de ejemplo para el modo REPLAY: caso de dolor torácico que degenera
 * en paro por fibrilación ventricular. Cada chunk simula 10–15 s de audio ya
 * transcrito. `phase` indica en qué fase de la sesión ocurre ese fragmento.
 */
export type SampleChunk = { phase: "prebriefing" | "escenario" | "debriefing"; text: string; secs: number };

export const SAMPLE_CASE = {
  title: "Dolor torácico → paro por FV (SCA)",
  description: "Varón de 58 años con dolor torácico opresivo de 40 minutos, diaforesis y náusea. Evoluciona a paro por fibrilación ventricular durante la valoración.",
  scenarioText:
    "Paciente masculino de 58 años, tabaquismo activo, hipertenso mal controlado. Llega a urgencias con dolor retroesternal opresivo irradiado a brazo izquierdo, de 40 minutos, con diaforesis y náusea. TA 148/92, FC 96, SatO2 94%. A los 6 minutos del escenario presenta paro presenciado por FV. Se espera: monitorización temprana, ECG de 12 derivaciones, AAS, activación de código, RCP de alta calidad, desfibrilación temprana, manejo post-paro.",
  objectives: [
    "Reconocer el síndrome coronario agudo e iniciar manejo inicial (MONA selectivo, ECG < 10 min)",
    "Activar el código de paro y asignar roles de equipo con comunicación de asa cerrada",
    "Ejecutar RCP de alta calidad con fracción de compresión > 80% y desfibrilación temprana",
    "Demostrar liderazgo y comunicación efectiva bajo presión",
  ],
};

export const SAMPLE_TRANSCRIPT: SampleChunk[] = [
  // --- PREBRIEFING ---
  { phase: "prebriefing", secs: 14, text: "Instructor: Bienvenidos al escenario. Recuerden el contrato de ficción: todo lo que pase aquí lo tratamos como real, y este es un espacio seguro para aprender, no para evaluar personas." },
  { phase: "prebriefing", secs: 12, text: "Instructor: El simulador responde a lo que hagan: pueden auscultar, monitorizar, pedir estudios. Los medicamentos se administran verbalizando dosis y vía." },
  { phase: "prebriefing", secs: 11, text: "Instructor: Roles: Mariana lidera, Carlos vía aérea, Sofía circulación y registro. ¿Dudas? Perfecto, pasamos al escenario." },
  // --- ESCENARIO ---
  { phase: "escenario", secs: 13, text: "Paciente: Doctora, me duele mucho el pecho, como si me apretaran... empezó hace como cuarenta minutos y no se me quita. Tengo náuseas." },
  { phase: "escenario", secs: 12, text: "Mariana (líder): Señor, lo vamos a atender. Carlos, oxígeno si satura menos de 90 y prepara vía aérea. Sofía, monitor, toma de signos y vía periférica por favor." },
  { phase: "escenario", secs: 14, text: "Sofía: TA 148/92, frecuencia 96, satura 94% al aire ambiente. Monitor colocado, ritmo sinusal con extrasístoles ventriculares frecuentes. Canalizo brazo derecho." },
  { phase: "escenario", secs: 12, text: "Mariana: Solicito ECG de doce derivaciones ya, y aspirina 300 miligramos masticada. ¿Alguien confirma alergias? Paciente niega alergias." },
  { phase: "escenario", secs: 13, text: "Carlos: ECG listo... veo elevación del ST en DII, DIII y aVF de unos tres milímetros. Esto es un infarto inferior, sugiero activar código infarto." },
  { phase: "escenario", secs: 11, text: "Mariana: De acuerdo, activen código infarto, avisen a hemodinamia. Nitroglicerina en pausa hasta descartar ventrículo derecho. Derechas por favor." },
  { phase: "escenario", secs: 14, text: "Paciente: Me siento muy mal... se me nubla la vista... [alarma del monitor] Sofía: ¡Se desploma! No responde, no respira. ¡Al monitor: fibrilación ventricular!" },
  { phase: "escenario", secs: 13, text: "Mariana: Iniciamos RCP, Carlos compresiones fuertes y rápidas, yo cuento. Sofía carga el desfibrilador a 200 bifásico. Pide ayuda y trae el carro rojo." },
  { phase: "escenario", secs: 12, text: "Sofía: Cargado a 200. Todos fuera, oxígeno fuera... descarga administrada. Reanudamos compresiones de inmediato, dos minutos, yo registro el tiempo." },
  { phase: "escenario", secs: 14, text: "Carlos: Cambio de compresor. Mariana: adrenalina 1 miligramo IV ahora y prepara amiodarona 300 por si persiste FV. Vamos minuto uno del ciclo." },
  { phase: "escenario", secs: 13, text: "Sofía: Análisis de ritmo... sinusal, ¡hay pulso carotídeo! Retorno a circulación espontánea. TA 96/60, satura 91% con bolsa válvula mascarilla." },
  { phase: "escenario", secs: 12, text: "Mariana: Cuidados post-paro: oxígeno a meta 94-98, ECG de control, traslado urgente a hemodinamia. Buen trabajo equipo, Sofía documenta tiempos." },
  // --- DEBRIEFING ---
  { phase: "debriefing", secs: 13, text: "Instructor: Antes de analizar, ¿cómo se sienten? Mariana: Al principio tranquila, pero cuando entró en paro sentí que me congelé dos segundos antes de pedir el desfibrilador." },
  { phase: "debriefing", secs: 14, text: "Carlos: Yo sentí que las compresiones estuvieron bien, pero no estoy seguro de si el cambio de compresor fue a tiempo. Sofía: A mí me costó registrar y cargar el desfibrilador a la vez." },
  { phase: "debriefing", secs: 13, text: "Instructor: Vi que el ECG salió en menos de ocho minutos y la aspirina fue temprana, eso me gustó. Me pregunto qué los llevó a pausar la nitroglicerina, cuéntenme su razonamiento." },
  { phase: "debriefing", secs: 12, text: "Mariana: Pensé en infarto inferior con posible extensión a ventrículo derecho, y sin derechas no quería arriesgar hipotensión. Instructor: Excelente razonamiento clínico explícito." },
  { phase: "debriefing", secs: 14, text: "Instructor: Sobre el paro: el tiempo a la primera descarga fue de 52 segundos, muy bueno. ¿Qué harían diferente en la asignación de tareas cuando Sofía quedó saturada de funciones?" },
  { phase: "debriefing", secs: 13, text: "Carlos: Podríamos haber pedido ayuda antes para delegar el registro. Mariana: Sí, y yo pude verbalizar antes el plan de medicamentos para anticipar a Sofía. Instructor: Buen cierre, eso va al plan de acción." },
];
