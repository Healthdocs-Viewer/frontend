import {
  AcceptConsentRequest,
  CaseSummary,
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
import { mockBackendService, MockHttpError } from "./mockApi";

const TOKEN_KEY = "healthdocs_jwt_token";
const MOCK_MODE_KEY = "healthdocs_use_mock_api";

// Configurable: Usar mock por defecto en desarrollo local si el backend no está disponible
export function isMockMode(): boolean {
  const saved = localStorage.getItem(MOCK_MODE_KEY);
  return saved === null ? true : saved === "true";
}

export function setMockMode(enabled: boolean): void {
  localStorage.setItem(MOCK_MODE_KEY, String(enabled));
  window.dispatchEvent(
    new CustomEvent("healthdocs_mock_mode_changed", { detail: enabled }),
  );
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
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
    throw errData;
  }

  return await res.json();
}

// Adaptador que conmuta entre API Real y Mock conforme a OpenAPI
export const apiClient = {
  auth: {
    async login(req: LoginRequest): Promise<LoginResponse> {
      if (isMockMode()) {
        try {
          return await mockBackendService.login(req);
        } catch (err: any) {
          if (err instanceof MockHttpError) {
            // 401 en login: credenciales incorrectas — no hay sesión que cerrar
            // 403 en login: cuenta sin rol habilitado — emitir forbidden pero NO unauthorized
            if (err.status === 403) notifyForbidden(err.message);
          }
          throw err;
        }
      }
      return request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(req),
      });
    },

    /**
     * GET /me — Restaurar sesión desde token almacenado.
     * Lanza el error tal cual para que AuthContext decida qué hacer:
     * - 401/UNAUTHORIZED → cerrar sesión (token inválido/expirado)
     * - 403/FORBIDDEN    → mantener sesión, mostrar aviso de permisos
     * - TypeError (red)  → mantener sesión, no se sabe si el token es válido
     */
    async getMe(): Promise<UserProfile> {
      const token = getStoredToken();
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
  },

  patient: {
    async createCase(req: CreateCaseRequest): Promise<CaseSummary> {
      const token = getStoredToken();
      if (!token) throw new Error("No autenticado");

      if (isMockMode()) {
        try {
          return await mockBackendService.createCase(token, req);
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
        body: JSON.stringify(req),
      });
    },

    async acceptConsent(
      caseId: string,
      req: AcceptConsentRequest,
    ): Promise<ConsentRecord> {
      const token = getStoredToken();
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
      const token = getStoredToken();
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

      return request<CaseSummary[]>("/cases");
    },

    async createInputUpload(
      caseId: string,
      req: CreateUploadIntentRequest,
    ): Promise<UploadIntent> {
      const token = getStoredToken();
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

    async getPatientResult(caseId: string): Promise<PatientResult> {
      const token = getStoredToken();

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
    async completeUpload(
      fileId: string,
    ): Promise<CompleteUploadResponse> {
      const token = getStoredToken();
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

      return request<CompleteUploadResponse>(
        `/files/${fileId}/complete`,
        {
          method: "POST",
        },
      );
    },
  },

  internal: {
    async listAssignedCases(): Promise<InternalCaseSummary[]> {
      const token = getStoredToken();
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

    async createInputDownload(
      caseId: string,
      fileId: string,
    ): Promise<DownloadIntent> {
      const token = getStoredToken();
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

    async createResultDownload(caseId: string, resultId: string): Promise<DownloadIntent> {
      if (isMockMode()) {
        const token = getStoredToken();
        if (!token) throw new Error("No autenticado");
        return mockBackendService.createResultDownload(token, caseId, resultId);
      }
      return request<DownloadIntent>(`/internal/cases/${caseId}/results/${resultId}/download`, { method: "POST" });
    },

    async deleteResult(caseId: string, resultId: string): Promise<void> {
      if (isMockMode()) {
        const token = getStoredToken();
        if (!token) throw new Error("No autenticado");
        return mockBackendService.deleteResult(token, caseId, resultId);
      }
      return request<void>(`/internal/cases/${caseId}/results/${resultId}`, { method: "DELETE" });
    },

    async createResultUpload(
      caseId: string,
      req: CreateUploadIntentRequest,
    ): Promise<UploadIntent> {
      const token = getStoredToken();
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
    async listPendingCases(): Promise<InternalCaseSummary[]> {
      const token = getStoredToken();
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
      const token = getStoredToken();
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
      const token = getStoredToken();
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
