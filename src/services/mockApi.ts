import {
  AcceptConsentRequest,
  CaseSummary,
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

/**
 * Credenciales de prueba alineadas con el backend.
 * El campo `email` del contrato OpenAPI transporta el identificador de usuario;
 * el backend de desarrollo acepta el nombre simple sin dominio.
 *
 * IMPORTANTE: No importar este arreglo en componentes de UI — usar QUICK_LOGIN_CREDENTIALS.
 */
export const TEST_USERS = [
  {
    email: 'paciente',
    password: 'paciente123',
    user: {
      id: 'b0000001-0000-0000-0000-000000000001',
      email: 'paciente',
      role: 'paciente' as const,
      enabled: true,
    },
  },
  {
    email: 'estudiante',
    password: 'estudiante123',
    user: {
      id: 'b0000002-0000-0000-0000-000000000002',
      email: 'estudiante',
      role: 'estudiante' as const,
      enabled: true,
    },
  },
  {
    email: 'profesor',
    password: 'profesor123',
    user: {
      id: 'b0000003-0000-0000-0000-000000000003',
      email: 'profesor',
      role: 'profesor' as const,
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
  role: 'paciente' | 'estudiante' | 'profesor';
  email: string;
  password: string;
}> = [
  { label: 'Paciente', role: 'paciente', email: 'paciente', password: 'paciente123' },
  { label: 'Estudiante', role: 'estudiante', email: 'estudiante', password: 'estudiante123' },
  { label: 'Profesor', role: 'profesor', email: 'profesor', password: 'profesor123' },
];

interface MockDatabase {
  cases: Array<{
    id: string;
    patientId: string;
    status: CaseSummary['status'];
    referenceCode: string;
    studyType: string;
    createdAt: string;
    assignedUserIds: string[];
    files: FileSummary[];
    result?: {
      id: string;
      availableAt?: string;
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
  const result1Id = 'r1000000-0000-0000-0000-000000000001';

  return {
    cases: [
      {
        id: case1Id,
        patientId: 'b0000001-0000-0000-0000-000000000001',
        status: 'RESULT_AVAILABLE',
        referenceCode: 'CAS-20260910-0001',
        studyType: 'RADIOGRAFIA_TORAX',
        createdAt: '2026-09-10T14:30:00Z',
        assignedUserIds: [
          'b0000002-0000-0000-0000-000000000002',
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
          downloadUrl: 'https://storage.healthdocs.local/results/r1000000.mp4',
          isAvailable: true,
        },
      },
      {
        id: case2Id,
        patientId: 'b0000001-0000-0000-0000-000000000001',
        status: 'ENABLED_FOR_PROCESSING',
        referenceCode: 'CAS-20260914-0001',
        studyType: 'RESONANCIA_CEREBRAL',
        createdAt: '2026-09-14T11:15:00Z',
        assignedUserIds: [
          'b0000002-0000-0000-0000-000000000002',
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
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const initial = getInitialDatabase();
  saveDb(initial);
  return initial;
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

  async createCase(token: string, request: CreateCaseRequest): Promise<CaseSummary> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'paciente') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol paciente puede crear casos');
    }

    const db = loadDb();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newCase = {
      id: crypto.randomUUID(),
      patientId: parsed.sub,
      status: 'CREATED' as const,
      referenceCode: `CAS-${today}-${String(db.cases.length + 1).padStart(4, '0')}`,
      studyType: request.studyType,
      createdAt: new Date().toISOString(),
      assignedUserIds: ['b0000003-0000-0000-0000-000000000003'], // Profesor preasignado en demo
      files: [],
    };

    db.cases.unshift(newCase);
    saveDb(db);

    return {
      id: newCase.id,
      referenceCode: newCase.referenceCode,
      status: newCase.status,
      studyType: newCase.studyType,
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
    if (parsed.role !== 'paciente') {
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
    if (parsed.role !== 'paciente') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol paciente puede consultar sus casos');
    }

    const db = loadDb();
    return db.cases
      .filter((c) => c.patientId === parsed.sub)
      .map((c) => ({
        id: c.id,
        referenceCode: c.referenceCode,
        status: c.status,
        studyType: c.studyType,
        createdAt: c.createdAt,
      }));
  },

  async createInputUpload(
    token: string,
    caseId: string,
    req: CreateUploadIntentRequest
  ): Promise<{ file: FileSummary; uploadUrl: string; expiresAt: string }> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'paciente') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo paciente propietario puede solicitar carga');
    }

    const db = loadDb();
    const targetCase = db.cases.find((c) => c.id === caseId);
    if (!targetCase || targetCase.patientId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para este caso');
    }

    const fileId = crypto.randomUUID();
    const file: FileSummary = {
      id: fileId,
      originalFilename: req.originalFilename,
      contentType: req.contentType,
      sizeBytes: req.sizeBytes || 1024,
      fileKind: 'INPUT',
    };

    targetCase.files.push(file);
    saveDb(db);

    return {
      file,
      uploadUrl: `https://storage.healthdocs.local/uploads/${fileId}?signature=mock`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async completeUpload(token: string, fileId: string): Promise<FileSummary> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);

    const db = loadDb();
    let foundFile: FileSummary | null = null;

    for (const c of db.cases) {
      const f = c.files.find((file) => file.id === fileId);
      if (f) {
        foundFile = f;
        if (f.fileKind === 'INPUT') {
          if (c.patientId !== parsed.sub) {
            throw new MockHttpError(403, 'FORBIDDEN', 'No es propietario del caso');
          }
          c.status = 'FILES_RECEIVED';
        } else if (f.fileKind === 'RESULT') {
          if (!c.assignedUserIds.includes(parsed.sub)) {
            throw new MockHttpError(403, 'FORBIDDEN', 'Usuario no habilitado para este caso');
          }
          c.status = 'RESULT_UPLOADED';
        }
        break;
      }
    }

    if (!foundFile) {
      throw new MockHttpError(404, 'NOT_FOUND', 'Archivo no encontrado');
    }

    saveDb(db);
    return foundFile;
  },

  async getPatientResult(token: string, caseId: string): Promise<PatientResult> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'paciente') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo paciente puede consultar el resultado');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || c.patientId !== parsed.sub) {
      throw new MockHttpError(403, 'FORBIDDEN', 'No autorizado para consultar este caso');
    }

    if (!c.result || !c.result.isAvailable || !c.result.availableAt) {
      throw new MockHttpError(404, 'NOT_FOUND', 'El resultado aún no está disponible');
    }

    return {
      id: c.result.id,
      caseId: c.id,
      availableAt: c.result.availableAt,
      download: {
        downloadUrl: c.result.downloadUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    };
  },

  async listAssignedCases(token: string): Promise<InternalCaseSummary[]> {
    await new Promise((r) => setTimeout(r, 150));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'estudiante' && parsed.role !== 'profesor') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo usuarios internos autorizados');
    }

    const db = loadDb();
    return db.cases
      .filter((c) => c.assignedUserIds.includes(parsed.sub))
      .map((c) => ({
        id: c.id,
        referenceCode: c.referenceCode,
        status: c.status,
        studyType: c.studyType,
        createdAt: c.createdAt,
        files: c.files,
      }));
  },

  async createInputDownload(
    token: string,
    caseId: string,
    fileId: string
  ): Promise<DownloadIntent> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'estudiante' && parsed.role !== 'profesor') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Permisos insuficientes');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
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

  async createResultUpload(
    token: string,
    caseId: string,
    req: CreateUploadIntentRequest
  ): Promise<{ file: FileSummary; uploadUrl: string; expiresAt: string }> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'estudiante' && parsed.role !== 'profesor') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Permisos insuficientes');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Caso no habilitado para este usuario');
    }

    const fileId = crypto.randomUUID();
    const file: FileSummary = {
      id: fileId,
      originalFilename: req.originalFilename,
      contentType: req.contentType,
      sizeBytes: req.sizeBytes || 5000000,
      fileKind: 'RESULT',
    };

    c.files.push(file);

    const resultId = crypto.randomUUID();
    c.result = {
      id: resultId,
      isAvailable: false,
      downloadUrl: `https://storage.healthdocs.local/results/${resultId}.mp4`,
    };

    saveDb(db);

    return {
      file,
      uploadUrl: `https://storage.healthdocs.local/results/upload/${fileId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },

  async assignCase(token: string, caseId: string, userId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
    const parsed = verifyMockToken(token);
    if (parsed.role !== 'profesor') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol profesor puede habilitar casos');
    }

    const db = loadDb();
    const c = db.cases.find((item) => item.id === caseId);
    if (!c || !c.assignedUserIds.includes(parsed.sub)) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Profesor no habilitado para este caso');
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
    if (parsed.role !== 'profesor') {
      throw new MockHttpError(403, 'FORBIDDEN', 'Solo el rol profesor puede publicar resultados');
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
      throw new MockHttpError(403, 'FORBIDDEN', 'Profesor no habilitado para este caso de resultado');
    }

    foundCase.result!.isAvailable = true;
    foundCase.result!.availableAt = new Date().toISOString();
    foundCase.status = 'RESULT_AVAILABLE';

    saveDb(db);
  },
};
