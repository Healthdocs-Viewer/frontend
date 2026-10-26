import {
  AcceptConsentRequest,
  CaseSummary,
  CaseDetails,
  CompleteUploadResponse,
  ConsentRecord,
  CreateCaseRequest,
  CreateUploadIntentRequest,
  DownloadIntent,
  FileSummary,
  InternalCaseSummary,
  LoginRequest,
  LoginResponse,
  PatientResult,
  UserProfile,
} from '../types/api';
import type { PatientCasesQuery, PatientCasesResponse } from '../types/patientCases';
import type { ResearcherAcademicCaseDetail } from '../types/academicCases';

/**
 * Credenciales de prueba alineadas con el backend.
 * Estas credenciales deben coincidir con las cuentas sembradas por el backend local.
 *
 * IMPORTANTE: No importar este arreglo en componentes de UI — usar QUICK_LOGIN_CREDENTIALS.
 */
export const TEST_USERS = [
  {
    email: 'paciente@healthdocs.local',
    password: 'paciente123',
    user: {
      id: 'b0000001-0000-0000-0000-000000000001',
      email: 'paciente@healthdocs.local',
      role: 'patient' as const,
      enabled: true,
    },
  },
  {
    email: 'estudiante@healthdocs.local',
    password: 'estudiante123',
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'estudiante@healthdocs.local',
      role: 'researcher' as const,
      enabled: true,
    },
  },
  {
    email: 'profesor@healthdocs.local',
    password: 'profesor123',
    user: {
      id: 'b0000003-0000-0000-0000-000000000003',
      email: 'profesor@healthdocs.local',
      role: 'coordinator' as const,
      enabled: true,
    },
  },
];

/**
 * Accesos rápidos que se pueden mostrar en la UI sin acoplarla al formato interno del mock.
 * Sólo expone lo que la pantalla de login necesita saber: credenciales y etiqueta de rol.
 */
export const QUICK_LOGIN_CREDENTIALS: Array<{
  label: string;
  role: 'patient' | 'researcher' | 'coordinator' | 'admin';
  email: string;
  password: string;
}> = [
  { label: 'Paciente', role: 'patient', email: 'paciente@healthdocs.local', password: 'paciente123' },
  { label: 'Investigador', role: 'researcher', email: 'estudiante@healthdocs.local', password: 'estudiante123' },
  { label: 'Coordinador', role: 'coordinator', email: 'profesor@healthdocs.local', password: 'profesor123' },
];

interface MockDatabase {
  uploadInitiators: Record<string, string>;
  uploadExpiresAt: Record<string, string>;
  activeUploadByCase: Record<string, string>;
  uploadedInputFiles: Record<string, boolean>;
  confirmedInputFiles: Record<string, boolean>;
  caseCreations: Record<string, { request: string; caseId: string }>;
  cases: Array<{
    id: string;
    patientId: string;
    status: CaseSummary['status'];
    referenceCode: string;
    studyName: string;
    additionalReference?: string | null;
    originInstitution?: string | null;
    studyDate?: string | null;
    notes?: string | null;
    creationStage?: CaseDetails["creationStage"];
    acceptedTermsVersions?: string[];
    createdAt: string;
    assignedUserIds: string[];
    files: FileSummary[];
    result?: {
      id: string;
      availableAt?: string;
      uploadedBy?: string;
      uploadedAt?: string;
      downloadUrl: string;
      isAvailable: boolean;
    };
  }>;
}

const STORAGE_KEY = 'healthdocs_mock_db_v1';

function getInitialDatabase(): MockDatabase {
  const case1Id = 'c1000000-0000-0000-0000-000000000001';
  const case2Id = 'c2000000-0000-0000-0000-000000000002';
  const file1Id = 'f1000000-0000-0000-0000-000000000001';
  const file2Id = 'f2000000-0000-0000-0000-000000000002';
  const fileResultId = 'f3000000-0000-0000-0000-000000000003';
  const result1Id = '10000000-0000-0000-0000-000000000001';

  return {
    uploadInitiators: {},
    uploadExpiresAt: {},
    activeUploadByCase: {},
    uploadedInputFiles: {},
    confirmedInputFiles: {},
    caseCreations: {},
    cases: [
      {
        id: case1Id,
        patientId: 'b0000001-0000-0000-0000-000000000001',
        status: 'RESULT_AVAILABLE',
        referenceCode: 'CAS-20260910-0001',
        studyName: 'Radiografía de tórax',
        createdAt: '2026-09-10T14:30:00Z',
        assignedUserIds: [
          '00000000-0000-0000-0000-000000000002',
          'b0000003-0000-0000-0000-000000000003',
        ],
        files: [
          {
            id: file1Id,
            originalFilename: 'radiografia_torax_lateral.dcm',
            contentType: 'application/dicom',
            sizeBytes: 1548290,
            fileKind: 'INPUT',
          },
          {
            id: fileResultId,
            originalFilename: 'informe_diagnostico_reconstruccion.mp4',
            contentType: 'video/mp4',
            sizeBytes: 8432100,
            fileKind: 'RESULT',
          },
        ],
        result: {
          id: result1Id,
          availableAt: '2026-09-12T09:00:00Z',
      downloadUrl: '',
          isAvailable: true,
        },
      },
      {
        id: case2Id,
        patientId: 'b0000001-0000-0000-0000-000000000001',
        status: 'ENABLED_FOR_PROCESSING',
        referenceCode: 'CAS-20260914-0001',
        studyName: 'Resonancia cerebral',
        createdAt: '2026-09-14T11:15:00Z',
        assignedUserIds: [
          '00000000-0000-0000-0000-000000000002',
          'b0000003-0000-0000-0000-000000000003',
        ],
        files: [
          {
            id: file2Id,
            originalFilename: 'resonancia_magnetica_cerebral.dcm',
            contentType: 'application/dicom',
            sizeBytes: 4125890,
            fileKind: 'INPUT',
          },
        ],
      },
    ],
  };
}

function loadDb(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as Partial<MockDatabase>;
      return {
        cases: db.cases ?? [],
        uploadInitiators: db.uploadInitiators ?? {},
        uploadExpiresAt: db.uploadExpiresAt ?? {},
        activeUploadByCase: db.activeUploadByCase ?? {},
        uploadedInputFiles: db.uploadedInputFiles ?? {},
        confirmedInputFiles: db.confirmedInputFiles ?? {},
        caseCreations: db.caseCreations ?? {},
      };
    }
  } catch {
    // fallback
  }
  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
}

function createTemporaryResultDownload(caseId: string, resultId: string): DownloadIntent {
  const expiresAtMs = Date.now() + 15 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();
  // El token es opaco y la ruta solo contiene identificadores técnicos.
  return {
    downloadUrl: `https://storage.healthdocs.local/api/v1/dev/downloads/result/${caseId}/${resultId}?expires=${expiresAtMs}&token=${crypto.randomUUID()}`,
    expiresAt,
  };
}

function saveDb(db: MockDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export interface MockTokenPayload {
  sub: string;
  role: string;
  email: string;
  exp: number;
}

export function parseMockToken(token: string): MockTokenPayload | null {
  try {
    if (!token.startsWith('mock_jwt_')) return null;
    const jsonStr = atob(token.replace('mock_jwt_', ''));
    const payload = JSON.parse(jsonStr);
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch {
    return null;
  }
}

export function isMockTokenExpired(token: string): boolean {
  const parsed = parseMockToken(token);
  if (!parsed) return true;
  if (typeof parsed.exp !== 'number') return false;
  const now = Math.floor(Date.now() / 1000);
  return parsed.exp <= now;
}

export function verifyMockToken(token: string): MockTokenPayload {
  const parsed = parseMockToken(token);
  if (!parsed) {
    throw new MockHttpError(401, 'UNAUTHORIZED', 'Token ausente o inválido');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof parsed.exp === 'number' && parsed.exp <= now) {
    throw new MockHttpError(401, 'UNAUTHORIZED', 'Token expirado');
  }
  return parsed;
}

export class MockHttpError extends Error {
  status: number;
  code: string;
  traceId: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.traceId = `trace-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const mockBackendService = {
  resetDatabase() {
    const initial = getInitialDatabase();
    saveDb(initial);
  },

  async login(request: LoginRequest): Promise<LoginResponse> {
    await new Promise((r) => setTimeout(r, 200));

    const found = TEST_USERS.find(
      (u) => u.email.toLowerCase() === request.email.trim().toLowerCase()
    );

    if (!found || found.password !== request.password) {
      throw new MockHttpError(401, 'UNAUTHORIZED', 'Credenciales incorrectas');
    }

    if (!found.user.enabled) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Cuenta no habilitada para operar');
    }

    const payload = {
      sub: found.user.id,
      role: found.user.role,
      email: found.user.email,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const token = `mock_jwt_${btoa(JSON.stringify(payload))}`;

    return {
      token,
      user: found.user,
    };
  },

  async getMe(token: string): Promise<UserProfile> {
    await new Promise((r) => setTimeout(r, 100));
    const parsed = verifyMockToken(token);

    const found = TEST_USERS.find((u) => u.user.id === parsed.sub);
    if (!found || !found.user.enabled) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Usuario no encontrado o deshabilitado');
    }

    return found.user;
  },

  async createCase(
    token: string,
    request: CreateCaseRequest,
    idempotencyKey?: string,
  ): Promise<CaseSummary> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'patient') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol paciente puede crear casos');
    }

    const todayParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const todayValues = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
    const today = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;
    const parsedStudyDate = request.studyDate ? new Date(`${request.studyDate}T00:00:00`) : null;
    if (!request.studyName?.trim() || request.studyName.trim().length > 200
      || !request.originInstitution?.trim() || request.originInstitution.trim().length > 200
      || !request.studyDate || Number.isNaN(parsedStudyDate?.getTime()) || request.studyDate > today
      || (request.additionalReference?.trim().length ?? 0) > 100
      || (request.notes?.length ?? 0) > 500) {
      throw new MockHttpError(400, 'VALIDATION_ERROR', 'Revisa los datos y límites del formulario del caso');
    }

    const db = loadDb();
    const normalizedRequest = JSON.stringify({
      studyName: request.studyName.trim(),
      additionalReference: request.additionalReference?.trim() || null,
      originInstitution: request.originInstitution.trim(),
      studyDate: request.studyDate,
      notes: request.notes?.trim() || null,
      creationStage: "CONSENT_PENDING",
      acceptedTermsVersions: [],
    });
    const priorCreation = idempotencyKey ? db.caseCreations[idempotencyKey] : undefined;
    if (priorCreation) {
      if (priorCreation.request !== normalizedRequest) {
        throw new MockHttpError(409, 'CONFLICT', 'Idempotency-Key ya utilizada con otro contenido');
      }
      const existingCase = db.cases.find((item) => item.id === priorCreation.caseId);
      if (existingCase) {
        return {
          id: existingCase.id,
          referenceCode: existingCase.referenceCode,
          status: existingCase.status,
          studyName: existingCase.studyName,
          createdAt: existingCase.createdAt,
        };
      }
    }
    const referenceDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newCase = {
      id: crypto.randomUUID(),
      patientId: parsed.sub,
      status: 'CREATED' as const,
      referenceCode: `CAS-${referenceDate}-${String(db.cases.length + 1).padStart(4, '0')}`,
      studyName: request.studyName.trim(),
      additionalReference: request.additionalReference?.trim() || null,
      originInstitution: request.originInstitution.trim(),
      studyDate: request.studyDate,
      notes: request.notes?.trim() || null,
      createdAt: new Date().toISOString(),
      assignedUserIds: ['b0000003-0000-0000-0000-000000000003'], // Coordinador preasignado en demo
      files: [],
    };

    db.cases.unshift(newCase);
    if (idempotencyKey) {
      db.caseCreations[idempotencyKey] = { request: normalizedRequest, caseId: newCase.id };
    }
    saveDb(db);

    return {
      id: newCase.id,
      referenceCode: newCase.referenceCode,
      status: newCase.status,
      studyName: newCase.studyName,
      createdAt: newCase.createdAt,
    };
  },

  async acceptConsent(
    token: string,
    caseId: string,
    req: AcceptConsentRequest
  ): Promise<ConsentRecord> {
    await new Promise((r) => setTimeout(r, 180));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'patient') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo paciente propietario puede aceptar términos');
    }

    const db = loadDb();
    const targetCase = db.cases.find((c) => c.id === caseId);
    if (!targetCase || targetCase.patientId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para este caso');
    }
    if (!req.termsVersion || req.termsVersion.trim() !== '1.0') {
      throw new MockHttpError(400, 'VALIDATION_ERROR', 'Versión de términos inválida');
    }
    if (targetCase.creationStage !== "CONSENT_PENDING") {
      throw new MockHttpError(409, 'CONFLICT', 'El caso no está pendiente de consentimiento');
    }
    targetCase.acceptedTermsVersions ??= [];
    if (targetCase.acceptedTermsVersions.includes(req.termsVersion)) {
      throw new MockHttpError(409, 'CONFLICT', 'El consentimiento ya fue aceptado para esta versión');
    }
    targetCase.acceptedTermsVersions.push(req.termsVersion);
    targetCase.creationStage = "FILE_PENDING";
    saveDb(db);

    return {
      id: crypto.randomUUID(),
      caseId,
      termsVersion: req.termsVersion,
      acceptedAt: new Date().toISOString(),
    };
  },

  async listMyCases(token: string): Promise<CaseSummary[]> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'patient') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol paciente puede consultar sus casos');
    }

    const db = loadDb();
    return db.cases
      .filter((c) => c.patientId === parsed.sub)
      .map((c) => ({
        id: c.id,
        referenceCode: c.referenceCode,
        status: c.status,
        studyName: c.studyName,
        createdAt: c.createdAt,
      }));
  },

  async getCaseDetails(token: string, caseId: string): Promise<CaseDetails> {
    await new Promise((r) => setTimeout(r, 100));
    const parsed = verifyMockToken(token);
    const targetCase = loadDb().cases.find((c) => c.id === caseId);
    if (!targetCase || targetCase.patientId !== parsed.sub) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Caso no encontrado');
    }
    const creationStage = targetCase.creationStage
      ?? (targetCase.status === "CREATED" ? "CONSENT_PENDING" : null);
    return {
      id: targetCase.id,
      referenceCode: targetCase.referenceCode,
      status: creationStage ?? targetCase.status,
      studyName: targetCase.studyName,
      additionalReference: targetCase.additionalReference ?? null,
      originInstitution: targetCase.originInstitution ?? null,
      studyDate: targetCase.studyDate ?? null,
      notes: targetCase.notes ?? null,
      createdAt: targetCase.createdAt,
      updatedAt: targetCase.createdAt,
      creationStage,
      availableResultId: null,
    };
  },

  async getPatientCases(token: string, query: PatientCasesQuery = {}): Promise<PatientCasesResponse> {
    await new Promise((r) => setTimeout(r, 100));
    const parsed = verifyMockToken(token);
    const db = loadDb();
    const normalizedQuery = query.q?.trim().toLocaleLowerCase() ?? "";
    const matching = db.cases
      .filter((item) => item.patientId === parsed.sub)
      .filter((item) => !normalizedQuery || `${item.referenceCode} ${item.studyName}`.toLocaleLowerCase().includes(normalizedQuery));
    const bucket = (item: (typeof db.cases)[number]) => {
      if (item.creationStage || item.status === "CREATED" || item.status === "FILES_RECEIVED") return "PENDING";
      if (item.status === "RESULT_AVAILABLE") return "RESULT_AVAILABLE";
      return "IN_PROGRESS";
    };
    const statusCounts = {
      ALL: matching.length,
      PENDING: matching.filter((item) => bucket(item) === "PENDING").length,
      IN_PROGRESS: matching.filter((item) => bucket(item) === "IN_PROGRESS").length,
      RESULT_AVAILABLE: matching.filter((item) => bucket(item) === "RESULT_AVAILABLE").length,
    };
    const filtered = query.status
      ? matching.filter((item) => bucket(item) === query.status)
      : matching;
    const sort = query.sort ?? "createdAt:desc";
    filtered.sort((a, b) => sort === "createdAt:asc"
      ? a.createdAt.localeCompare(b.createdAt)
      : b.createdAt.localeCompare(a.createdAt));
    const page = Math.max(0, query.page ?? 0);
    const size = Math.max(1, query.size ?? 10);
    const items = filtered.slice(page * size, (page + 1) * size).map((item) => ({
      id: item.id,
      referenceCode: item.referenceCode,
      studyName: item.studyName,
      status: item.status,
      creationStage: item.creationStage ?? (item.status === "CREATED" ? "CONSENT_PENDING" as const : null),
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
      availableResultId: item.result?.isAvailable ? item.result.id : null,
    }));
    return {
      items,
      page,
      size,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      statusCounts,
      appliedFilters: { q: query.q?.trim() ?? "", status: query.status ?? "ALL", sort },
    };
  },

  async submitCase(token: string, caseId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 120));
    const parsed = verifyMockToken(token);
    if (parsed.role !== "patient") {
      throw new MockHttpError(403, "FORBIDDEN", "Solo paciente propietario puede enviar el caso");
    }
    const db = loadDb();
    const targetCase = db.cases.find((item) => item.id === caseId);
    if (!targetCase || targetCase.patientId !== parsed.sub) {
      throw new MockHttpError(404, "NOT_FOUND", "Caso no encontrado");
    }
    if (targetCase.creationStage !== "CONFIRMATION_PENDING"
      || !targetCase.acceptedTermsVersions?.length
      || !targetCase.files.some((file) => file.fileKind === "INPUT" && db.confirmedInputFiles[file.id])) {
      throw new MockHttpError(409, "CONFLICT", "El caso aún no está listo para enviarse");
    }
    targetCase.status = "FILES_RECEIVED";
    targetCase.creationStage = null;
    saveDb(db);
  },

  async createInputUpload(
    token: string,
    caseId: string,
    req: CreateUploadIntentRequest
  ): Promise<{ file: FileSummary; uploadUrl: string; expiresAt: string }> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'patient') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo paciente propietario puede solicitar carga');
    }

    const db = loadDb();
    const targetCase = db.cases.find((c) => c.id === caseId);
    if (!targetCase || targetCase.patientId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para este caso');
    }

    const activeFileId = db.activeUploadByCase[caseId];
    if (activeFileId) {
      const activeExpiry = Date.parse(db.uploadExpiresAt[activeFileId] ?? "");
      if (Number.isFinite(activeExpiry) && activeExpiry > Date.now()) {
        throw new MockHttpError(409, 'CONFLICT', 'Ya existe una intención de carga vigente para este caso');
      }
      delete db.activeUploadByCase[caseId];
    }
    if (targetCase.creationStage !== "FILE_PENDING" && targetCase.creationStage !== "CONFIRMATION_PENDING") {
      throw new MockHttpError(409, 'CONFLICT', 'El caso no está listo para recibir archivos');
    }
    if (!req.originalFilename?.trim() || !req.contentType?.trim() || !Number.isFinite(req.sizeBytes) || req.sizeBytes <= 0) {
      throw new MockHttpError(400, 'VALIDATION_ERROR', 'El archivo requiere nombre, tipo de contenido y tamaño positivo');
    }

    const fileId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const file: FileSummary = {
      id: fileId,
      originalFilename: req.originalFilename,
      contentType: req.contentType,
      sizeBytes: req.sizeBytes || 1024,
      fileKind: 'INPUT',
    };

    targetCase.files.push(file);
    db.uploadInitiators[fileId] = parsed.sub;
    db.uploadExpiresAt[fileId] = expiresAt;
    db.activeUploadByCase[caseId] = fileId;
    saveDb(db);

    return {
      file,
      uploadUrl: `https://storage.healthdocs.local/uploads/${fileId}?signature=mock`,
      expiresAt,
    };
  },

  async uploadInputFile(token: string, fileId: string, browserFile: File): Promise<void> {
    await new Promise((r) => setTimeout(r, 120));
    const parsed = verifyMockToken(token);
    const db = loadDb();
    const alreadyConfirmedCase = db.cases.find((c) =>
      c.patientId === parsed.sub && c.files.some((file) => file.id === fileId) && db.confirmedInputFiles[fileId],
    );
    if (alreadyConfirmedCase) return;
    const ownerId = db.uploadInitiators[fileId];
    if (!ownerId || ownerId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para esta carga');
    }
    const expiresAt = Date.parse(db.uploadExpiresAt[fileId] ?? "");
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      throw new MockHttpError(409, 'CONFLICT', 'La URL temporal de carga expiró');
    }
    const targetCase = db.cases.find((c) => c.files.some((file) => file.id === fileId));
    const targetFile = targetCase?.files.find((file) => file.id === fileId);
    if (!targetCase || targetCase.patientId !== parsed.sub || !targetFile || targetFile.fileKind !== 'INPUT') {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo no encontrado');
    }
    if (browserFile.size !== targetFile.sizeBytes) {
      throw new MockHttpError(400, 'VALIDATION_ERROR', 'El tamaño del archivo no coincide con la intención');
    }
    db.uploadedInputFiles[fileId] = true;
    saveDb(db);
  },

  async completeUpload(token: string, fileId: string): Promise<CompleteUploadResponse> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);

    const db = loadDb();
    for (const c of db.cases) {
      const confirmed = c.files.find((file) => file.id === fileId);
      if (confirmed && db.confirmedInputFiles[fileId]) {
        if (c.patientId !== parsed.sub) throw new MockHttpError(403, 'FORBIDDEN', 'No es propietario del caso');
        return { file: confirmed, caseStatus: c.status };
      }
    }
    let foundFile: FileSummary | null = null;
    let foundCase: (typeof db.cases)[number] | null = null;

    const initiator = db.uploadInitiators[fileId];
    const expiresAt = db.uploadExpiresAt[fileId];
    if (!initiator || initiator !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo quien inició la intención puede confirmarla');
    }
    if (!expiresAt || Date.now() >= Date.parse(expiresAt)) {
      throw new MockHttpError(409, 'CONFLICT', 'La intención de carga expiró');
    }

    for (const c of db.cases) {
      const f = c.files.find((file) => file.id === fileId);
      if (f) {
        foundFile = f;
        foundCase = c;
        if (f.fileKind === 'INPUT') {
          if (c.patientId !== parsed.sub) {
            throw new MockHttpError(403, 'FORBIDDEN', 'No es propietario del caso');
          }
          if (!db.uploadedInputFiles[fileId]) {
            throw new MockHttpError(409, 'CONFLICT', 'El archivo todavía no fue cargado');
          }
          if (c.creationStage !== "FILE_PENDING" && c.creationStage !== "CONFIRMATION_PENDING") {
            throw new MockHttpError(409, 'CONFLICT', 'El caso no está listo para confirmar archivos');
          }
          c.creationStage = "CONFIRMATION_PENDING";
          db.confirmedInputFiles[fileId] = true;
          delete db.uploadedInputFiles[fileId];
          delete db.activeUploadByCase[c.id];
        } else if (f.fileKind === 'RESULT') {
          if (!c.assignedUserIds.includes(parsed.sub)) {
            throw new MockHttpError(403, 'FORBIDDEN', 'Usuario no habilitado para este caso');
          }
          const resultId = crypto.randomUUID();
          c.result = {
            id: resultId,
            uploadedBy: parsed.sub,
            uploadedAt: new Date().toISOString(),
            isAvailable: false,
            downloadUrl: `https://storage.healthdocs.local/results/${resultId}.mp4`,
          };
          c.status = 'RESULT_UPLOADED';
        }
        break;
      }
    }

    if (!foundFile) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo no encontrado');
    }

    saveDb(db);
    delete db.uploadInitiators[fileId];
    delete db.uploadExpiresAt[fileId];
    saveDb(db);
    return {
      file: foundFile,
      ...(foundFile.fileKind === 'RESULT' && foundCase?.result
        ? {
            result: {
              id: foundCase.result.id,
              caseId: foundCase.id,
              status: 'UPLOADED' as const,
              uploadedBy: parsed.sub,
              uploadedAt: new Date().toISOString(),
            },
          }
        : {}),
      caseStatus: foundCase?.status ?? 'FILES_RECEIVED',
    };
  },

  async getPatientResult(token: string, caseId: string): Promise<PatientResult> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'patient') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo paciente puede consultar el resultado');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || c.patientId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para consultar este caso');
    }

    if (!c.result || !c.result.isAvailable || !c.result.availableAt) {
      throw new MockHttpError(409, 'CONFLICT', 'El resultado aún no está disponible');
    }

    return {
      id: c.result.id,
      caseId: c.id,
      availableAt: c.result.availableAt,
      download: createTemporaryResultDownload(c.id, c.result.id),
    };
  },

  async listAssignedCases(token: string): Promise<InternalCaseSummary[]> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo investigadores pueden consultar sus casos asignados');
    }

    const db = loadDb();
    return db.cases
      .filter(
        (c) =>
          c.assignedUserIds.includes(parsed.sub) &&
          [
            'FILES_RECEIVED',
            'INPUT_CHANGE_DRAFT',
            'INPUT_CHANGE_REVIEW',
            'ENABLED_FOR_PROCESSING',
            'RESULT_UPLOADED',
            'RESULT_AVAILABLE',
          ].includes(c.status) &&
          c.files.some((file) => file.fileKind === 'INPUT')
      )
      .map((c) => ({
        id: c.id,
        referenceCode: c.referenceCode,
        status: c.status,
        studyName: c.studyName,
        createdAt: c.createdAt,
        updatedAt: c.result?.availableAt ?? c.result?.uploadedAt ?? c.createdAt,
        files: c.files,
        result: c.result
          ? {
              id: c.result.id,
              originalFilename: c.files.find((file) => file.fileKind === 'RESULT')?.originalFilename ?? 'resultado',
              status: c.result.isAvailable ? 'AVAILABLE' as const : 'UPLOADED' as const,
              uploadedBy: c.result.uploadedBy,
              uploadedAt: c.result.uploadedAt,
              availableAt: c.result.availableAt,
            }
          : undefined,
      }));
  },

  async getAssignedCaseDetail(token: string, caseId: string): Promise<ResearcherAcademicCaseDetail> {
    await new Promise((r) => setTimeout(r, 120));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo investigadores pueden consultar el detalle de sus casos');
    }
    const db = loadDb();
    const item = db.cases.find((candidate) => candidate.id === caseId
      && candidate.assignedUserIds.includes(parsed.sub)
      && ['FILES_RECEIVED', 'INPUT_CHANGE_DRAFT', 'INPUT_CHANGE_REVIEW', 'ENABLED_FOR_PROCESSING', 'RESULT_UPLOADED', 'RESULT_AVAILABLE'].includes(candidate.status)
      && candidate.files.some((file) => file.fileKind === 'INPUT'));
    if (!item) throw new MockHttpError(404, 'NOT_FOUND', 'Caso no encontrado');

    const latestUpdate = item.result?.availableAt ?? item.result?.uploadedAt ?? item.createdAt;
    const resultFile = item.result && item.files.find((file) => file.fileKind === 'RESULT');
    return {
      case: {
        id: item.id,
        referenceCode: item.referenceCode,
        status: item.status as ResearcherAcademicCaseDetail['case']['status'],
        studyName: item.studyName,
        additionalReference: item.additionalReference ?? null,
        originInstitution: item.originInstitution ?? null,
        studyDate: item.studyDate ?? null,
        notes: item.notes ?? null,
        createdAt: item.createdAt,
        updatedAt: latestUpdate,
        receivedAt: item.createdAt,
        availableResultId: item.result?.isAvailable ? item.result.id : null,
      },
      inputFiles: item.files.filter((file) => file.fileKind === 'INPUT').map((file) => ({
        id: file.id,
        originalFilename: file.originalFilename,
        contentType: file.contentType ?? null,
        sizeBytes: file.sizeBytes,
        uploadedAt: item.createdAt,
      })),
      researchers: item.assignedUserIds.map((userId) => ({
        userId,
        fullName: userId === parsed.sub ? 'Tú (investigador asignado)' : null,
        researcherCode: null,
        authorizationStatus: 'AUTHORIZED',
        assignedAt: item.createdAt,
      })),
      results: item.result ? [{
        id: item.result.id,
        originalFilename: resultFile?.originalFilename ?? 'resultado',
        contentType: resultFile?.contentType ?? null,
        sizeBytes: resultFile?.sizeBytes ?? null,
        uploadedAt: item.result.uploadedAt ?? null,
        updatedAt: latestUpdate,
        version: 1,
        status: item.result.isAvailable ? 'AVAILABLE' : 'UPLOADED',
        correctionRequest: null,
        publicationType: item.result.isAvailable ? 'INITIAL' : null,
        availableAt: item.result.availableAt ?? null,
      }] : [],
    };
  },

  async createInputDownload(
    token: string,
    caseId: string,
    fileId: string
  ): Promise<DownloadIntent> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher' && parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Permisos insuficientes');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    const canReviewPending = parsed.role === 'coordinator' && c?.status === 'FILES_RECEIVED';
    if (!c || (!c.assignedUserIds.includes(parsed.sub) && !canReviewPending)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Caso no habilitado para este usuario');
    }

    const f = c.files.find((file) => file.id === fileId && file.fileKind === 'INPUT');
    if (!f) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo no encontrado en el caso');
    }

    return {
      downloadUrl: `https://storage.healthdocs.local/downloads/${fileId}?file=${encodeURIComponent(f.originalFilename)}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async createPatientInputDownload(
    token: string,
    caseId: string,
    fileId: string,
  ): Promise<DownloadIntent> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    const c = loadDb().cases.find((item) => item.id === caseId && item.patientId === parsed.sub);
    const file = c?.files.find((item) => item.id === fileId && item.fileKind === 'INPUT');
    if (!c || !file) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo no encontrado en el caso');
    }
    return {
      downloadUrl: `https://storage.healthdocs.local/downloads/${fileId}?file=${encodeURIComponent(file.originalFilename)}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async createResultDownload(
    token: string,
    caseId: string,
    resultId: string,
  ): Promise<DownloadIntent> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher' && parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Permisos insuficientes');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Caso no habilitado para este usuario');
    }
    if (!c.result || c.result.id !== resultId) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Resultado no encontrado en el caso');
    }

    const resultFile = c.files.find((file) => file.fileKind === 'RESULT');
    if (!resultFile) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo del resultado no encontrado');
    }

    return createTemporaryResultDownload(c.id, c.result.id);
  },

  async deleteResult(token: string, caseId: string, resultId: string, reason: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el investigador asignado puede eliminar una carga pendiente');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Caso no habilitado para este usuario');
    }
    if (!c.result || c.result.id !== resultId) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Resultado no encontrado en el caso');
    }
    if (c.result.isAvailable || c.status !== 'RESULT_UPLOADED' || !reason.trim()) {
      throw new MockHttpError(409, 'CONFLICT', 'Solo se puede retirar un resultado pendiente de revisión con un motivo');
    }

    c.files = c.files.filter((file) => file.fileKind !== 'RESULT');
    delete c.result;
    c.status = 'ENABLED_FOR_PROCESSING';
    saveDb(db);
  },

  async createResultUpload(
    token: string,
    caseId: string,
    req: CreateUploadIntentRequest
  ): Promise<{ file: FileSummary; uploadUrl: string; expiresAt: string }> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'researcher' && parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Permisos insuficientes');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Caso no habilitado para este usuario');
    }

    const fileId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const file: FileSummary = {
      id: fileId,
      originalFilename: req.originalFilename,
      contentType: req.contentType,
      sizeBytes: req.sizeBytes || 5000000,
      fileKind: 'RESULT',
    };

    c.files.push(file);
    db.uploadInitiators[fileId] = parsed.sub;
    db.uploadExpiresAt[fileId] = expiresAt;

    saveDb(db);

    return {
      file,
      uploadUrl: `https://storage.healthdocs.local/results/upload/${fileId}`,
      expiresAt,
    };
  },

  async listPendingCases(token: string): Promise<InternalCaseSummary[]> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol coordinador puede consultar casos pendientes');
    }

    const db = loadDb();
    return db.cases
      .filter(
        (c) =>
          c.status === 'FILES_RECEIVED' &&
          c.files.some((file) => file.fileKind === 'INPUT')
      )
      .map((c) => ({
        id: c.id,
        referenceCode: c.referenceCode,
        status: c.status,
        studyName: c.studyName,
        createdAt: c.createdAt,
        files: c.files,
      }));
  },

  async assignCase(token: string, caseId: string, userId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol coordinador puede habilitar casos');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Coordinador no habilitado para este caso');
    }

    if (!c.assignedUserIds.includes(userId)) {
      c.assignedUserIds.push(userId);
      if (c.status === 'FILES_RECEIVED') {
        c.status = 'ENABLED_FOR_PROCESSING';
      }
    }

    saveDb(db);
  },

  async makeResultAvailable(token: string, resultId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'coordinator') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol coordinador puede publicar resultados');
    }

    const db = loadDb();
    let foundCase = null;
    for (const c of db.cases) {
      if (c.result && c.result.id === resultId) {
        foundCase = c;
        break;
      }
    }

    if (!foundCase || !foundCase.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Coordinador no habilitado para este caso de resultado');
    }

    foundCase.result!.isAvailable = true;
    foundCase.result!.availableAt = new Date().toISOString();
    foundCase.status = 'RESULT_AVAILABLE';

    saveDb(db);
  },
};
