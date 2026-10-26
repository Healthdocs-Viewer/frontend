export type CoordinatorDashboardCase = {
  id: string;
  referenceCode: string;
  studyName: string;
  researcher: string;
  status: "FILES_RECEIVED" | "ENABLED_FOR_PROCESSING" | "INPUT_CHANGE_REVIEW" | "RESULT_UPLOADED";
  receivedAt: string;
  priority: "urgent" | "normal";
};

export type CoordinatorDashboardData = {
  metrics: { activeCases: number; waitingAssignment: number; inProgress: number; needsReview: number };
  weeklyActivity: { day: string; cases: number }[];
  attentionCases: CoordinatorDashboardCase[];
  activity: { id: string; title: string; detail: string; time: string; tone: "blue" | "green" | "amber" }[];
};

const mockDashboard: CoordinatorDashboardData = {
  metrics: { activeCases: 28, waitingAssignment: 6, inProgress: 17, needsReview: 5 },
  weeklyActivity: [
    { day: "Lun", cases: 4 }, { day: "Mar", cases: 7 }, { day: "Mié", cases: 5 },
    { day: "Jue", cases: 9 }, { day: "Vie", cases: 6 }, { day: "Sáb", cases: 3 }, { day: "Dom", cases: 2 },
  ],
  attentionCases: [
    { id: "case-1", referenceCode: "CAS-20261018-0042", studyName: "Resonancia magnética cerebral", researcher: "Sin asignar", status: "FILES_RECEIVED", receivedAt: "2026-10-18T14:20:00Z", priority: "urgent" },
    { id: "case-2", referenceCode: "CAS-20261017-0038", studyName: "Tomografía de tórax", researcher: "Dra. Laura Méndez", status: "INPUT_CHANGE_REVIEW", receivedAt: "2026-10-17T16:05:00Z", priority: "urgent" },
    { id: "case-3", referenceCode: "CAS-20261016-0031", studyName: "Ecografía abdominal", researcher: "Dr. Andrés Rojas", status: "RESULT_UPLOADED", receivedAt: "2026-10-16T11:40:00Z", priority: "normal" },
    { id: "case-4", referenceCode: "CAS-20261015-0027", studyName: "Radiografía de tórax", researcher: "Dra. Paula Díaz", status: "ENABLED_FOR_PROCESSING", receivedAt: "2026-10-15T09:15:00Z", priority: "normal" },
  ],
  activity: [
    { id: "activity-1", title: "Nuevo caso recibido", detail: "CAS-20261018-0042 · Resonancia magnética cerebral", time: "Hace 20 min", tone: "blue" },
    { id: "activity-2", title: "Resultado cargado", detail: "CAS-20261016-0031 · Ecografía abdominal", time: "Hace 1 h", tone: "green" },
    { id: "activity-3", title: "Cambio de información solicitado", detail: "CAS-20261017-0038 · Tomografía de tórax", time: "Hace 3 h", tone: "amber" },
  ],
};

/** Fuente temporal para diseñar la experiencia antes de conectar el endpoint real. */
export async function getCoordinatorDashboard(): Promise<CoordinatorDashboardData> {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  return mockDashboard;
}
