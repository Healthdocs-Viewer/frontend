import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PatientResultPage } from '../pages/PatientResultPage';
import { apiClient } from '../services/apiClient';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'patient-1', email: 'patient@example.test', role: 'patient', enabled: true },
    token: 'token',
  }),
}));

describe('PatientResultPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('muestra resultado disponible y usa el enlace temporal del backend', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockResolvedValue({
      id: 'result-1', caseId: 'case-1', availableAt: '2026-09-19T10:00:00Z',
      download: { downloadUrl: 'https://storage.test/temp-download', expiresAt: '2026-09-19T10:15:00Z' },
    });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-available')).toBeInTheDocument());
    expect(screen.getByTestId('patient-result-download')).toHaveAttribute('href', 'https://storage.test/temp-download');
    expect(screen.queryByText(/diagnóstico|archivo|contenido clínico/i)).not.toBeInTheDocument();
  });

  it('muestra resultado pendiente ante 409', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockRejectedValue({ status: 409, code: 'CONFLICT' });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-pending')).toBeInTheDocument());
  });

  it('muestra acceso no autorizado ante 403', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockRejectedValue({ status: 403, code: 'FORBIDDEN' });
    render(<PatientResultPage caseId="case-otro" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-forbidden')).toBeInTheDocument());
  });

  it('muestra resultado no encontrado ante 404', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockRejectedValue({ status: 404, code: 'NOT_FOUND' });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-not-found')).toBeInTheDocument());
  });

  it('muestra sesión expirada ante 401', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockRejectedValue({ status: 401, code: 'UNAUTHORIZED' });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-expired')).toBeInTheDocument());
  });

  it('muestra error temporal y permite reintentar', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockRejectedValue({ status: 503, code: 'TEMPORARY_ERROR' });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-temporary-error')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('oculta el enlace cuando expiresAt ya venció', async () => {
    vi.spyOn(apiClient.patient, 'getPatientResult').mockResolvedValue({
      id: 'result-1', caseId: 'case-1', availableAt: '2026-09-19T10:00:00Z',
      download: { downloadUrl: 'https://storage.test/temp-download?token=opaque', expiresAt: '2020-01-01T00:00:00Z' },
    });
    render(<PatientResultPage caseId="case-1" />);
    await waitFor(() => expect(screen.getByTestId('patient-result-expired')).toBeInTheDocument());
    expect(screen.queryByTestId('patient-result-download')).not.toBeInTheDocument();
  });
});
