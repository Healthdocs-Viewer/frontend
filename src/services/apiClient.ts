import {
  AcceptConsentRequest,
  CaseSummary,
  CaseDetails,
  CompleteUploadResponse,
  ConsentRecord,
  CreateCaseRequest,
  CreateUploadIntentRequest,
  DownloadIntent,
  ErrorResponse,
  FileSummary,
  InternalCaseSummary,
  LoginRequest,
  LoginResponse,
  PatientResult,
  UploadIntent,
  UserProfile,
} from "../types/api";
import type { PatientCasesQuery, PatientCasesResponse } from "../types/patientCases";
import type { PatientDashboardResponse } from "../types/patientDashboard";
import type { NotificationItem, NotificationsQuery, NotificationsResponse } from "../types/notifications";
import type { CoordinatorAcademicCaseDetail, CoordinatorAcademicCasesQuery, CoordinatorAcademicCasesResponse, CoordinatorInputChangeRequestSummary, ResearcherAcademicCaseDetail } from "../types/academicCases";
import type { StudentAuthorizationStatus } from "../types/academicStudents";
import type { PatientInputChangeRequest } from "../types/patientCaseDetail";
import type { ResearcherResultsResponse } from "../types/researcherResults";
import type { CoordinatorResultsResponse } from "../types/coordinatorResults";
import { mockBackendService, MockHttpError } from "./mockApi";
import { authService, clearStoredToken, getStoredToken, setStoredToken } from "./authService";

const MOCK_MODE_KEY = "healthdocs_use_mock_api";

// Compatibility exports for existing local-auth tests and development helpers.
export { clearStoredToken, getStoredToken, setStoredToken };

// Configurable: Usar mock por defecto en desarrollo local si el backend no está disponible
export function isMockMode(): boolean {
  if (authService.usesManagedProvider) return false;
  const saved = localStorage.getItem(MOCK_MODE_KEY);
  return saved === null ? true : saved === "true";
}

export function setMockMode(enabled: boolean): void {
  localStorage.setItem(MOCK_MODE_KEY, String(enabled));
  window.dispatchEvent(
    new CustomEvent("healthdocs_mock_mode_changed", { detail: enabled }),
  );
}

/**
 * Notifica un 401: la sesión es inválida o expirada.
 * NO limpia el token aquí — esa responsabilidad es de AuthContext mediante el evento.
 * Así se evita la doble limpieza y se mantiene una sola fuente de verdad.
 */
export function notifyUnauthorized(): void {
  window.dispatchEvent(new CustomEvent("healthdocs_unauthorized"));
}

/**
 * Notifica un 403: la identidad está autenticada pero no tiene permisos.
 * No implica cierre de sesión.
 */
export function notifyForbidden(
  message: string = "Permisos insuficientes para realizar esta acción.",
): void {
  window.dispatchEvent(
    new CustomEvent("healthdocs_forbidden", { detail: { message } }),
  );
}

const API_BASE_URL = "/api/v1";

/**
 * Función base de fetch que:
 * - Adjunta el Bearer token si existe.
 * - Maneja 401 (emite evento de sesión inválida, lanza error).
 * - Maneja 403 (emite evento de permisos, lanza error, NO cierra sesión).
 * - Lanza ErrorResponse tipado para el resto de errores HTTP.
 * - Propaga errores de red sin tratarlos como errores de autenticación.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
  tokenOverride?: string | null,
): Promise<T> {
  const token = tokenOverride === undefined ? await authService.getToken() : tokenOverride;
  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Enviar JWT como Bearer token en cada llamada API
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Los errores de red (TypeError: Failed to fetch, etc.) se propagan directamente
  // sin llamar notifyUnauthorized — no son fallos de autenticación.
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    let errData: ErrorResponse = {
      code: "UNAUTHORIZED",
      message: "Sesión expirada o credenciales inválidas",
      traceId: "trace-401",
    };
    try {
      errData = await res.json();
    } catch {
      // fallback al error por defecto
    }
    notifyUnauthorized();
    throw errData;
  }

  if (res.status === 403) {
    let errData: ErrorResponse = {
      code: "FORBIDDEN",
      message: "Permisos insuficientes para este recurso",
      traceId: "trace-403",
    };
    try {
      errData = await res.json();
    } catch {
      // fallback al error por defecto
    }
    notifyForbidden(errData.message);
    throw errData;
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  if (!res.ok) {
    let errData: ErrorResponse;
    try {
      errData = await res.json();
    } catch {
      errData = {
        code: `HTTP_${res.status}`,
        message: res.statusText || "Error en la petición",
        traceId: "trace-err",
      };
    }
    errData.status = res.status;
    throw errData;
  }

  return await res.json();
}

// Adaptador que conmuta entre API Real y Mock conforme a OpenAPI
export const apiClient = {
  auth: {
    async login(req: LoginRequest): Promise<LoginResponse> {
      const session = await authService.login(req);
      return { token: session.accessToken, user: await apiClient.auth.getMe() };
    },

    /**
     * GET /me — Restaurar sesión desde token almacenado.
     * Lanza el error tal cual para que AuthContext decida qué hacer:
     * - 401/UNAUTHORIZED → cerrar sesión (token inválido/expirado)
     * - 403/FORBIDDEN    → mantener sesión, mostrar aviso de permisos
     * - TypeError (red)  → mantener sesión, no se sabe si el token es válido
     */
    async getMe(): Promise<UserProfile> {
      const token = await authService.getToken();
      if (!token) {
        // No hay token: caso normal, no hay sesión. No emitir evento.
        const err: ErrorResponse = {
          code: "NO_TOKEN",
          message: "Sin token de sesión",
          traceId: "trace-no-token",
        };
        throw err;
      }

      if (isMockMode()) {
        // En mock los errores los maneja directamente AuthContext
        return await mockBackendService.getMe(token);
      }

      return request<UserProfile>("/me");
    },

    /**
     * POST /auth/register — provision the Healthdocs account for the current
     * verified identity. The Bearer token is attached by request(); no user ID,
     * email, or role is accepted from the browser as registration authority.
     */
    async register(): Promise<UserProfile> {
      return request<UserProfile>("/auth/register", { method: "POST" });
    },
  },

  patient: {
    async getCases(query: PatientCasesQuery = {}): Promise<PatientCasesResponse> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        try {
          return await mockBackendService.getPatientCases(token, query);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }
      const params = new URLSearchParams({
        q: query.q?.trim() ?? "",
        status: query.status ?? "ALL",
        sort: query.sort ?? "createdAt:desc",
        page: String(query.page ?? 0),
        size: String(query.size ?? 10),
      });
      return request<PatientCasesResponse>(`/cases?${params.toString()}`);
    },

    async getDashboard(): Promise<PatientDashboardResponse> {
      return request<PatientDashboardResponse>("/patient/dashboard");
    },

    async getNotifications(query: NotificationsQuery = {}): Promise<NotificationsResponse> {
      const params = new URLSearchParams({
        page: String(query.page ?? 0),
        size: String(query.size ?? 20),
      });
      return request<NotificationsResponse>(`/notifications?${params.toString()}`);
    },

    async markNotificationRead(notificationId: string): Promise<NotificationItem> {
      return request<NotificationItem>(
        `/notifications/${encodeURIComponent(notificationId)}/read`,
        { method: "POST" },
      );
    },

    async createCase(
      req: CreateCaseRequest,
      idempotencyKey: string = crypto.randomUUID(),
    ): Promise<CaseSummary> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createCase(token, req, idempotencyKey);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<CaseSummary>("/cases", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(req),
      });
    },

    async getCaseDetails(caseId: string): Promise<CaseDetails> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        try {
          return await mockBackendService.getCaseDetails(token, caseId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }
      return request<CaseDetails>(`/cases/${caseId}`);
    },

    async submitCase(caseId: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        try {
          await mockBackendService.submitCase(token, caseId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
        return;
      }
      return request<void>(`/cases/${caseId}/submission`, { method: "POST" });
    },

    async acceptConsent(
      caseId: string,
      req: AcceptConsentRequest,
    ): Promise<ConsentRecord> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.acceptConsent(token, caseId, req);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<ConsentRecord>(`/cases/${caseId}/consent`, {
        method: "POST",
        body: JSON.stringify(req),
      });
    },

    async listMyCases(): Promise<CaseSummary[]> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.listMyCases(token);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      const response = await request<CaseSummary[] | { items: CaseSummary[] }>("/cases?size=100");
      return Array.isArray(response) ? response : response.items;
    },

    async listMyCaseInputFiles(caseId: string): Promise<FileSummary[]> {
      return request<FileSummary[]>(`/cases/${caseId}/uploads`);
    },

    async createInputDownload(caseId: string, fileId: string): Promise<DownloadIntent> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createPatientInputDownload(token, caseId, fileId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<DownloadIntent>(`/cases/${caseId}/uploads/${fileId}/download`, {
        method: "POST",
      });
    },

    async createInputUpload(
      caseId: string,
      req: CreateUploadIntentRequest,
    ): Promise<UploadIntent> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createInputUpload(token, caseId, req);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<UploadIntent>(`/cases/${caseId}/uploads`, {
        method: "POST",
        body: JSON.stringify(req),
      });
    },

    async listInputChangeRequests(caseId: string): Promise<PatientInputChangeRequest[]> {
      return request<PatientInputChangeRequest[]>(`/cases/${caseId}/input-change-requests`);
    },

    async openInputChangeRequest(caseId: string): Promise<PatientInputChangeRequest> {
      return request<PatientInputChangeRequest>(`/cases/${caseId}/input-change-requests`, {
        method: "POST",
      });
    },

    async updateInputChangeReason(
      caseId: string,
      requestId: string,
      reason: string,
    ): Promise<PatientInputChangeRequest> {
      return request<PatientInputChangeRequest>(
        `/cases/${caseId}/input-change-requests/${requestId}`,
        { method: "PATCH", body: JSON.stringify({ reason }) },
      );
    },

    async createInputChangeUpload(
      caseId: string,
      requestId: string,
      req: CreateUploadIntentRequest,
    ): Promise<UploadIntent> {
      return request<UploadIntent>(
        `/cases/${caseId}/input-change-requests/${requestId}/uploads`,
        { method: "POST", body: JSON.stringify(req) },
      );
    },

    async removeInputChangeFile(
      caseId: string,
      requestId: string,
      fileId: string,
    ): Promise<void> {
      return request<void>(
        `/cases/${caseId}/input-change-requests/${requestId}/files/${fileId}`,
        { method: "DELETE" },
      );
    },

    async submitInputChangeRequest(caseId: string, requestId: string): Promise<void> {
      return request<void>(
        `/cases/${caseId}/input-change-requests/${requestId}/submission`,
        { method: "POST" },
      );
    },

    async cancelInputChangeRequest(caseId: string, requestId: string): Promise<void> {
      return request<void>(
        `/cases/${caseId}/input-change-requests/${requestId}/cancellation`,
        { method: "POST" },
      );
    },

    async getPatientResult(caseId: string): Promise<PatientResult> {
      const token = await authService.getToken();

      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        try {
          return await mockBackendService.getPatientResult(token, caseId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }
      return request<PatientResult>(`/cases/${caseId}/result`);
    },
  },

  files: {
    async uploadInputBinary(uploadUrl: string, fileId: string, file: File): Promise<void> {
      if (isMockMode()) {
        const token = await authService.getToken();
        if (!token) throw new Error("No autenticado");
        try {
          await mockBackendService.uploadInputFile(token, fileId, file);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
        return;
      }

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) {
        throw {
          status: response.status,
          code: `UPLOAD_HTTP_${response.status}`,
          message: response.statusText || "No se pudo cargar el archivo.",
        };
      }
    },

    async completeUpload(fileId: string): Promise<CompleteUploadResponse> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.completeUpload(token, fileId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      // Reuse the token checked above. This avoids a second session lookup
      // between the upload intent and confirmation (notably during refresh).
      return request<CompleteUploadResponse>(
        `/files/${fileId}/complete`,
        { method: "POST" },
        token,
      );
    },
  },

  internal: {
    async listResults(page = 0, size = 100): Promise<ResearcherResultsResponse> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      const query = new URLSearchParams({ page: String(page), size: String(size) });
      return request<ResearcherResultsResponse>(`/internal/results?${query.toString()}`);
    },

    async listAssignedCases(): Promise<InternalCaseSummary[]> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.listAssignedCases(token);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<InternalCaseSummary[]>("/internal/cases");
    },

    async getAssignedCaseDetail(caseId: string): Promise<ResearcherAcademicCaseDetail> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.getAssignedCaseDetail(token, caseId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<ResearcherAcademicCaseDetail>(`/internal/cases/${caseId}`);
    },

    async createInputDownload(
      caseId: string,
      fileId: string,
    ): Promise<DownloadIntent> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createInputDownload(
            token,
            caseId,
            fileId,
          );
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<DownloadIntent>(
        `/internal/cases/${caseId}/files/${fileId}/download`,
        { method: "POST" },
      );
    },

    async createResultDownload(
      caseId: string,
      resultId: string,
    ): Promise<DownloadIntent> {
      if (isMockMode()) {
        const token = await authService.getToken();
        if (!token) throw new Error("No autenticado");
        return mockBackendService.createResultDownload(token, caseId, resultId);
      }
      return request<DownloadIntent>(
        `/internal/cases/${caseId}/results/${resultId}/download`,
        { method: "POST" },
      );
    },

    async deleteResult(caseId: string, resultId: string, reason = "Retirado por el investigador"): Promise<void> {
      if (isMockMode()) {
        const token = await authService.getToken();
        if (!token) throw new Error("No autenticado");
        return mockBackendService.deleteResult(token, caseId, resultId, reason);
      }
      const query = new URLSearchParams({ reason });
      return request<void>(`/internal/cases/${caseId}/results/${resultId}?${query.toString()}`, {
        method: "DELETE",
      });
    },

    async createResultUpload(
      caseId: string,
      req: CreateUploadIntentRequest,
    ): Promise<UploadIntent> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createResultUpload(
            token,
            caseId,
            req,
          );
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<UploadIntent>(`/internal/cases/${caseId}/result-uploads`, {
        method: "POST",
        body: JSON.stringify(req),
      });
    },
  },

  operations: {
    async listCoordinatorResults(page = 0, size = 100): Promise<CoordinatorResultsResponse> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        const { getCoordinatorResultsMock } = await import("./coordinatorResults");
        return getCoordinatorResultsMock();
      }
      const params = new URLSearchParams({
        sort: "uploadedAt,desc",
        page: String(page),
        size: String(size),
      });
      return request<CoordinatorResultsResponse>(`/operations/results?${params.toString()}`);
    },

    async listPendingInputChangeRequests(): Promise<CoordinatorInputChangeRequestSummary[]> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) return [];
      return request<CoordinatorInputChangeRequestSummary[]>("/operations/input-change-requests");
    },

    async getInputChangeRequestForReview(requestId: string): Promise<PatientInputChangeRequest> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) throw new Error("No hay solicitudes de cambio de prueba para revisar en modo mock.");
      return request<PatientInputChangeRequest>(`/operations/input-change-requests/${requestId}`);
    },

    async createInputChangeReviewDownload(requestId: string, fileId: string): Promise<{ downloadUrl: string; expiresAt: string }> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) throw new Error("La descarga de archivos de revisión requiere conexión con el backend.");
      return request<{ downloadUrl: string; expiresAt: string }>(`/operations/input-change-requests/${requestId}/files/${fileId}/download`, {
        method: "POST",
      });
    },

    async approveInputChangeRequest(requestId: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) throw new Error("La decisión de solicitudes de cambio requiere conexión con el backend.");
      return request<void>(`/operations/input-change-requests/${requestId}/approval`, { method: "POST" });
    },

    async rejectInputChangeRequest(requestId: string, reason: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) throw new Error("La decisión de solicitudes de cambio requiere conexión con el backend.");
      return request<void>(`/operations/input-change-requests/${requestId}/rejection`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },

    async publishAcademicCaseResult(resultId: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        const { publishCoordinatorResultMock } = await import("./academicCases");
        return publishCoordinatorResultMock(resultId);
      }
      return request<void>(`/operations/results/${resultId}/availability`, { method: "POST" });
    },

    async requestAcademicResultCorrection(resultId: string, reason: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");
      if (isMockMode()) {
        const { requestCoordinatorResultCorrectionMock } = await import("./academicCases");
        return requestCoordinatorResultCorrectionMock(resultId, reason);
      }
      return request<void>(`/operations/results/${resultId}/correction-requests`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },

    async getAcademicCaseDetail(caseId: string): Promise<CoordinatorAcademicCaseDetail> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        const { getCoordinatorAcademicCaseDetailMock } = await import("./academicCases");
        return getCoordinatorAcademicCaseDetailMock(caseId);
      }

      return request<CoordinatorAcademicCaseDetail>(`/operations/cases/academic/${caseId}`);
    },

    async getAcademicCases(query: CoordinatorAcademicCasesQuery = {}): Promise<CoordinatorAcademicCasesResponse> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        const { getAcademicCasesMock } = await import("./academicCases");
        return getAcademicCasesMock(query);
      }

      const params = new URLSearchParams({
        q: query.q?.trim() ?? "",
        sort: query.sort ?? "receivedAt,desc",
        page: String(query.page ?? 0),
        size: String(query.size ?? 8),
      });
      if (query.status) params.set("status", query.status);
      return request<CoordinatorAcademicCasesResponse>(`/operations/cases/academic?${params.toString()}`);
    },

    async searchResearchers(query: string, status: StudentAuthorizationStatus, page = 0, size = 100) {
      const params = new URLSearchParams({ q: query, status, sort: "name,asc", page: String(page), size: String(size) });
      return request<{
        summary: { totalResearchers: number; authorizedResearchers: number; totalAssignedCases: number };
        items: Array<{ userId: string; researcherCode: string; fullName: string; email: string; authorizationStatus: StudentAuthorizationStatus; assignedCaseCount: number }>;
        page: number;
        size: number;
        totalItems: number;
        totalPages: number;
        appliedFilters: { q: string; status: StudentAuthorizationStatus | null; sort: string };
      }>(`/operations/researchers?${params.toString()}`);
    },

    async getCaseAssignments(caseId: string) {
      return request<{
        caseId: string;
        researcherIds: string[];
        researchers: Array<{ userId: string; researcherCode: string; fullName: string; email: string; authorizationStatus: StudentAuthorizationStatus; assignedCaseCount: number }>;
      }>(`/operations/cases/${caseId}/assignments`);
    },

    async replaceCaseAssignments(caseId: string, researcherIds: string[]) {
      return request<{
        caseId: string;
        researcherIds: string[];
        researchers: Array<{ userId: string; researcherCode: string; fullName: string; email: string; authorizationStatus: StudentAuthorizationStatus; assignedCaseCount: number }>;
      }>(`/operations/cases/${caseId}/assignments`, {
        method: "PUT",
        body: JSON.stringify({ researcherIds }),
      });
    },

    async listPendingCases(): Promise<InternalCaseSummary[]> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.listPendingCases(token);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<InternalCaseSummary[]>("/operations/cases/pending");
    },

    async assignCase(caseId: string, userId: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.assignCase(token, caseId, userId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<void>(`/operations/cases/${caseId}/assignments`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
    },

    async makeResultAvailable(resultId: string): Promise<void> {
      const token = await authService.getToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.makeResultAvailable(token, resultId);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            if (err.status === 401) notifyUnauthorized();
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }

      return request<void>(`/operations/results/${resultId}/availability`, {
        method: "POST",
      });
    },
  },
};
