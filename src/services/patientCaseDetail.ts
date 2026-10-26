import caseDetailMock from "../mocks/responses/patient-case-detail.json";
import type { PatientCaseDetailFile, PatientCaseDetailResponse, PatientCaseStatus } from "../types/patientCaseDetail";
import { apiClient, isMockMode } from "./apiClient";

const mockResponse = caseDetailMock as PatientCaseDetailResponse;

// Future endpoint: GET /cases/{caseId} + GET /cases/{caseId}/uploads.
// For now, any route key displays this fixture so the page can be previewed directly.
export async function getPatientCaseDetail(
  routeCaseKey: string,
): Promise<PatientCaseDetailResponse> {
  if (isMockMode()) return mockResponse;

  const cases = await apiClient.patient.listMyCases();
  const summary = cases.find((item) => item.id === routeCaseKey || item.referenceCode === routeCaseKey);
  const caseId = summary?.id ?? routeCaseKey;
  const [caseInfo, inputFiles, inputChangeRequests] = await Promise.all([
    apiClient.patient.getCaseDetails(caseId),
    apiClient.patient.listMyCaseInputFiles(caseId),
    apiClient.patient.listInputChangeRequests(caseId),
  ]);
  const currentStatus = caseInfo.status as PatientCaseStatus;
  const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short", timeStyle: "short",
  }).format(new Date(value));
  const files: PatientCaseDetailFile[] = inputFiles.map((file) => {
    const extension = file.originalFilename.split(".").pop()?.toLowerCase();
    const kind = ["zip", "rar", "7z"].includes(extension ?? "") ? "archive"
      : ["dcm", "dicom"].includes(extension ?? "") ? "dicom"
        : ["jpg", "jpeg", "png"].includes(extension ?? "") ? "image"
          : extension === "pdf" ? "pdf" : "file";
    return {
      id: file.id,
      name: file.originalFilename,
      date: formatDate(caseInfo.updatedAt),
      sortDate: Date.parse(caseInfo.updatedAt),
      size: formatFileSize(file.sizeBytes),
      kind,
    };
  });
  const resultFiles = caseInfo.availableResultId ? [
    { id: caseInfo.availableResultId, name: "Resultado del estudio", label: "Documento publicado", date: formatDate(caseInfo.updatedAt), size: "" },
  ] : [];
  const histories = inputChangeRequests.map((request) => ({
    title: request.status === "DRAFT" ? "Borrador de cambio iniciado"
      : request.status === "PENDING_REVIEW" ? "Solicitud enviada a coordinación"
        : `Solicitud ${request.status === "APPROVED" ? "aprobada" : request.status === "REJECTED" ? "rechazada" : "cancelada"}`,
    detail: request.decisionReason ?? request.reason ?? "Solicitud de actualización de archivos.",
    date: formatDate(request.updatedAt),
    state: request.status === "DRAFT" || request.status === "PENDING_REVIEW" ? "active" as const : "done" as const,
  }));
  return {
    case: {
      id: caseInfo.id,
      referenceCode: caseInfo.referenceCode,
      studyName: caseInfo.studyName,
      status: currentStatus,
      createdAt: caseInfo.createdAt,
      updatedAt: caseInfo.updatedAt,
    },
    steps: [
      { title: "Caso creado", detail: formatDate(caseInfo.createdAt), state: "done" },
      { title: "Archivos recibidos", detail: "Conjunto vigente del caso", state: "done" },
      { title: "Solicitud de cambio", detail: "Puedes iniciar una solicitud.", state: "pending" },
      { title: "Revisión de coordinación", detail: "Se revisará al enviar la solicitud.", state: "pending" },
      { title: "Resultado disponible", detail: "Aún no disponible", state: "pending" },
    ],
    history: [
      { title: "Caso creado", detail: "Se ha creado el caso en la plataforma.", date: formatDate(caseInfo.createdAt), state: "done" },
      ...histories,
    ],
    files,
    inputChangeRequests,
    consent: { status: "Aceptado", termsVersion: "", acceptedAt: "", description: "" },
    result: {
      status: resultFiles.length ? "Resultado disponible" : "Sin resultado",
      description: resultFiles.length ? "El resultado de tu estudio está disponible." : "Aún no hay resultados publicados.",
      files: resultFiles,
    },
  };
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = sizeBytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}
