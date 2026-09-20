import { describe, expect, beforeEach, it } from 'vitest';
import {
  mockBackendService,
  MockHttpError,
} from '../services/mockApi';

const STORAGE_KEY = 'healthdocs_mock_db_v1';

async function login(email: string, password: string): Promise<string> {
  const response = await mockBackendService.login({ email, password });
  return response.token;
}

describe('Regresiones del contrato de cargas', () => {
  beforeEach(() => {
    localStorage.clear();
    mockBackendService.resetDatabase();
  });

  it('usa UploadIntent.file y crea result únicamente al confirmar RESULT', async () => {
    const studentToken = await login('estudiante@healthdocs.local', 'estudiante123');

    const intent = await mockBackendService.createResultUpload(
      studentToken,
      'c2000000-0000-0000-0000-000000000002',
      {
        originalFilename: 'resultado.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      },
    );

    expect(intent.file.id).toBeTruthy();
    expect(intent).not.toHaveProperty('id');

    const beforeConfirmation = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const targetCase = beforeConfirmation.cases.find(
      (item: { id: string }) => item.id === 'c2000000-0000-0000-0000-000000000002',
    );
    expect(targetCase.result).toBeUndefined();

    const confirmation = await mockBackendService.completeUpload(studentToken, intent.file.id);

    expect(confirmation.file.id).toBe(intent.file.id);
    expect(confirmation.result?.id).toBeTruthy();
    expect(confirmation.caseStatus).toBe('RESULT_UPLOADED');
  });

  it('solo permite confirmar al usuario que creó la intención', async () => {
    const studentToken = await login('estudiante@healthdocs.local', 'estudiante123');
    const professorToken = await login('profesor@healthdocs.local', 'profesor123');

    const intent = await mockBackendService.createResultUpload(
      studentToken,
      'c2000000-0000-0000-0000-000000000002',
      {
        originalFilename: 'resultado.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      },
    );

    await expect(
      mockBackendService.completeUpload(professorToken, intent.file.id),
    ).rejects.toMatchObject<Partial<MockHttpError>>({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('rechaza la confirmación de una intención expirada con 409', async () => {
    const studentToken = await login('estudiante@healthdocs.local', 'estudiante123');
    const intent = await mockBackendService.createResultUpload(
      studentToken,
      'c2000000-0000-0000-0000-000000000002',
      {
        originalFilename: 'resultado.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      },
    );

    const database = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    database.uploadExpiresAt[intent.file.id] = new Date(Date.now() - 1_000).toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));

    await expect(
      mockBackendService.completeUpload(studentToken, intent.file.id),
    ).rejects.toMatchObject<Partial<MockHttpError>>({
      status: 409,
      code: 'CONFLICT',
    });
  });
});
