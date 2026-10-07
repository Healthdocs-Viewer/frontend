import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseStatusBadge } from '../components/internal/CaseStatusBadge';
import { InternalCaseList } from '../components/internal/InternalCaseList';
import { InternalCaseDetail } from '../components/internal/InternalCaseDetail';
import { InternalCaseSummary } from '../types/api';
import { apiClient } from '../services/apiClient';

const mockCases: InternalCaseSummary[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    referenceCode: 'CAS-20260910-0001',
    status: 'ENABLED_FOR_PROCESSING',
    studyName: 'Radiografía de tórax',
    createdAt: '2026-09-10T14:30:00Z',
    files: [
      {
        id: 'f1000000-0000-0000-0000-000000000001',
        originalFilename: 'radiografia_torax_lateral.dcm',
        contentType: 'application/dicom',
        sizeBytes: 1548290,
        fileKind: 'INPUT',
      },
    ],
  },
  {
    id: 'c2000000-0000-0000-0000-000000000002',
    referenceCode: 'CAS-20260914-0001',
    status: 'RESULT_UPLOADED',
    studyName: 'Resonancia cerebral',
    createdAt: '2026-09-14T11:15:00Z',
    files: [
      {
        id: 'f2000000-0000-0000-0000-000000000002',
        originalFilename: 'resonancia_cerebral.dcm',
        contentType: 'application/dicom',
        sizeBytes: 4125890,
        fileKind: 'INPUT',
      },
      {
        id: 'f3000000-0000-0000-0000-000000000003',
        originalFilename: 'informe_diagnostico.mp4',
        contentType: 'video/mp4',
        sizeBytes: 8432100,
        fileKind: 'RESULT',
      },
    ],
  },
];

describe('Etapa 1: Componentes del Flujo Interno', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('CaseStatusBadge', () => {
    it('renderiza correctamente el badge de ENABLED_FOR_PROCESSING', () => {
      render(<CaseStatusBadge status="ENABLED_FOR_PROCESSING" />);
      const badge = screen.getByTestId('status-badge-ENABLED_FOR_PROCESSING');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('Habilitado para Procesamiento');
    });

    it('renderiza correctamente el badge de RESULT_UPLOADED', () => {
      render(<CaseStatusBadge status="RESULT_UPLOADED" />);
      const badge = screen.getByTestId('status-badge-RESULT_UPLOADED');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('Resultado Cargado');
    });

    it('renderiza correctamente el badge de RESULT_AVAILABLE', () => {
      render(<CaseStatusBadge status="RESULT_AVAILABLE" />);
      const badge = screen.getByTestId('status-badge-RESULT_AVAILABLE');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('Resultado Disponible');
    });
  });

  describe('InternalCaseList', () => {
    it('muestra estado de carga cuando isLoading es true', () => {
      render(
        <InternalCaseList
          cases={[]}
          selectedCaseId={null}
          onSelectCase={vi.fn()}
          isLoading={true}
          errorMessage={null}
        />
      );
      expect(screen.getByTestId('cases-loading-state')).toBeInTheDocument();
      expect(screen.getByText('Cargando casos habilitados...')).toBeInTheDocument();
    });

    it('muestra estado de error y permite reintentar', async () => {
      const onRetry = vi.fn();
      render(
        <InternalCaseList
          cases={[]}
          selectedCaseId={null}
          onSelectCase={vi.fn()}
          isLoading={false}
          errorMessage="Error de conexión al servidor"
          onRetry={onRetry}
        />
      );
      expect(screen.getByTestId('cases-error-state')).toBeInTheDocument();
      expect(screen.getByText('Error de conexión al servidor')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
      await userEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('muestra estado vacío cuando no hay casos', () => {
      render(
        <InternalCaseList
          cases={[]}
          selectedCaseId={null}
          onSelectCase={vi.fn()}
          isLoading={false}
          errorMessage={null}
        />
      );
      expect(screen.getByTestId('cases-empty-state')).toBeInTheDocument();
      expect(screen.getByText('No hay casos habilitados')).toBeInTheDocument();
    });

    it('renderiza listado de casos y permite seleccionar un caso', async () => {
      const onSelectCase = vi.fn();
      render(
        <InternalCaseList
          cases={mockCases}
          selectedCaseId={mockCases[0].id}
          onSelectCase={onSelectCase}
          isLoading={false}
          errorMessage={null}
        />
      );

      expect(screen.getByTestId('cases-list-items')).toBeInTheDocument();
      expect(screen.getByText('CAS-20260910-0001')).toBeInTheDocument();
      expect(screen.getByText('CAS-20260914-0001')).toBeInTheDocument();
      expect(screen.getByTestId('cases-count-badge')).toHaveTextContent('2');

      const secondCase = screen.getByTestId(`case-item-${mockCases[1].id}`);
      await userEvent.click(secondCase);
      expect(onSelectCase).toHaveBeenCalledWith(mockCases[1].id);
    });
  });

  describe('InternalCaseDetail', () => {
    it('muestra mensaje cuando no hay caso seleccionado', () => {
      render(<InternalCaseDetail selectedCase={null} />);
      expect(screen.getByTestId('no-case-selected')).toBeInTheDocument();
      expect(screen.getByText('Ningún caso seleccionado')).toBeInTheDocument();
    });

    it('muestra tarjeta de confirmación visible del caso seleccionado y sus metadatos', () => {
      render(<InternalCaseDetail selectedCase={mockCases[0]} />);

      const confirmationCard = screen.getByTestId('selected-case-confirmation');
      expect(confirmationCard).toBeInTheDocument();
      expect(confirmationCard).toHaveTextContent('CAS-20260910-0001');
      expect(screen.getByText('RADIOGRAFIA TORAX')).toBeInTheDocument();
      expect(screen.getByText(mockCases[0].id)).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-ENABLED_FOR_PROCESSING')).toBeInTheDocument();
    });

    it('lista los archivos de entrada con su tamaño formateado y tipo MIME', () => {
      render(<InternalCaseDetail selectedCase={mockCases[0]} />);

      expect(screen.getByText('radiografia_torax_lateral.dcm')).toBeInTheDocument();
      expect(screen.getByText(/application\/dicom/)).toBeInTheDocument();
      expect(screen.getByText(/1.48 MB/)).toBeInTheDocument();
      expect(screen.getByTestId('download-button-f1000000-0000-0000-0000-000000000001')).toBeInTheDocument();
    });

    it('ejecuta la descarga del archivo de entrada y abre el enlace de descarga', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const downloadSpy = vi.spyOn(apiClient.internal, 'createInputDownload').mockResolvedValueOnce({
        downloadUrl: 'https://storage.healthdocs.local/downloads/f1000000.dcm',
        expiresAt: '2026-09-10T15:00:00Z',
      });

      render(<InternalCaseDetail selectedCase={mockCases[0]} />);

      const downloadBtn = screen.getByTestId(
        'download-button-f1000000-0000-0000-0000-000000000001'
      );
      await userEvent.click(downloadBtn);

      await waitFor(() => {
        expect(downloadSpy).toHaveBeenCalledWith(
          mockCases[0].id,
          'f1000000-0000-0000-0000-000000000001'
        );
        expect(windowOpenSpy).toHaveBeenCalledWith(
          'https://storage.healthdocs.local/downloads/f1000000.dcm',
          '_blank',
          'noopener,noreferrer'
        );
        expect(screen.getByTestId('download-success-alert')).toBeInTheDocument();
      });
    });

    it('maneja errores en la descarga mostrando alerta de error', async () => {
      vi.spyOn(apiClient.internal, 'createInputDownload').mockRejectedValueOnce(
        new Error('Enlace temporal caducado')
      );

      render(<InternalCaseDetail selectedCase={mockCases[0]} />);

      const downloadBtn = screen.getByTestId(
        'download-button-f1000000-0000-0000-0000-000000000001'
      );
      await userEvent.click(downloadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('download-error-alert')).toHaveTextContent(
          'Enlace temporal caducado'
        );
      });
    });

    it('muestra la sección de resultados si el caso ya tiene resultados cargados', () => {
      render(<InternalCaseDetail selectedCase={mockCases[1]} />);

      expect(screen.getByText(/Resultados Registrados/i)).toBeInTheDocument();
      expect(screen.getByText('informe_diagnostico.mp4')).toBeInTheDocument();
    });
  });
});
