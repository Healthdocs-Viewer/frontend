import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentDashboard } from '../pages/legacy/StudentDashboard';
import { ProfessorDashboard } from '../pages/ProfessorDashboard';
import { apiClient } from '../services/apiClient';
import { InternalCaseSummary } from '../types/api';

const mockAssignedCases: InternalCaseSummary[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    referenceCode: 'CAS-20260910-0001',
    status: 'ENABLED_FOR_PROCESSING',
    studyType: 'RADIOGRAFIA_TORAX',
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
    studyType: 'RESONANCIA_CEREBRAL',
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

const mockPendingCase: InternalCaseSummary = {
  id: 'c3000000-0000-0000-0000-000000000003',
  referenceCode: 'CAS-20260916-0001',
  status: 'FILES_RECEIVED',
  studyType: 'TOMOGRAFIA_ABDOMINAL',
  createdAt: '2026-09-16T09:45:00Z',
  files: [
    {
      id: 'f4000000-0000-0000-0000-000000000004',
      originalFilename: 'tomografia_abdominal.dcm',
      contentType: 'application/dicom',
      sizeBytes: 2048,
      fileKind: 'INPUT',
    },
  ],
};

describe('Etapa 3: Integración de Dashboards del Flujo Interno', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('StudentDashboard', () => {
    it('carga y renderiza los casos asignados y selecciona el primero por defecto', async () => {
      vi.spyOn(apiClient.internal, 'listAssignedCases').mockResolvedValueOnce(
        mockAssignedCases
      );

      render(<StudentDashboard />);

      expect(screen.getByText('Portal del Estudiante')).toBeInTheDocument();
      expect(screen.getByTestId('cases-loading-state')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getAllByText('CAS-20260910-0001').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByTestId('selected-case-confirmation')).toBeInTheDocument();
        expect(
          screen.getByTestId('download-button-f1000000-0000-0000-0000-000000000001')
        ).toBeInTheDocument();
        expect(screen.getByTestId('result-upload-card')).toBeInTheDocument();
      });
    });

    it('permite cambiar el caso seleccionado al hacer clic en otro caso', async () => {
      vi.spyOn(apiClient.internal, 'listAssignedCases').mockResolvedValueOnce(
        mockAssignedCases
      );

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.getAllByText('CAS-20260910-0001').length).toBeGreaterThanOrEqual(1);
      });

      const secondCaseItem = screen.getByTestId(`case-item-${mockAssignedCases[1].id}`);
      await userEvent.click(secondCaseItem);

      await waitFor(() => {
        const confirmation = screen.getByTestId('selected-case-confirmation');
        expect(confirmation).toHaveTextContent('CAS-20260914-0001');
      });
    });
  });

  describe('ProfessorDashboard', () => {
    it('muestra los casos pendientes en una lista separada y permite seleccionarlos', async () => {
      vi.spyOn(apiClient.internal, 'listAssignedCases').mockResolvedValue(mockAssignedCases);
      vi.spyOn(apiClient.operations, 'listPendingCases').mockResolvedValue([mockPendingCase]);

      render(<ProfessorDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Casos Pendientes de Habilitación')).toBeInTheDocument();
        expect(screen.getAllByText(mockPendingCase.referenceCode).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(`ID: ${mockPendingCase.id}`)).toBeInTheDocument();
        expect(screen.getByText(`INPUT: ${mockPendingCase.files[0].originalFilename}`)).toBeInTheDocument();
        expect(screen.getByTestId('professor-assign-card')).toBeInTheDocument();
      });

      expect(screen.getByText('Casos en Supervisión')).toBeInTheDocument();
      expect(screen.getByTestId(`case-item-${mockPendingCase.id}`)).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('recarga pendientes y supervisión después de asignar un caso pendiente', async () => {
      const assignedCasesSpy = vi
        .spyOn(apiClient.internal, 'listAssignedCases')
        .mockResolvedValue(mockAssignedCases);
      const pendingCasesSpy = vi
        .spyOn(apiClient.operations, 'listPendingCases')
        .mockResolvedValue([mockPendingCase]);
      const assignSpy = vi
        .spyOn(apiClient.operations, 'assignCase')
        .mockResolvedValueOnce(undefined);

      render(<ProfessorDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('professor-assign-card')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByTestId('submit-assign-button'));

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(
          mockPendingCase.id,
          '00000000-0000-0000-0000-000000000002'
        );
        expect(pendingCasesSpy).toHaveBeenCalledTimes(2);
        expect(assignedCasesSpy).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('assign-success-alert')).toBeInTheDocument();
      });
    });

    it('carga casos y permite ejecutar la asignación de un caso a un estudiante', async () => {
      vi.spyOn(apiClient.internal, 'listAssignedCases').mockResolvedValue(
        mockAssignedCases
      );
      const assignSpy = vi
        .spyOn(apiClient.operations, 'assignCase')
        .mockResolvedValueOnce(undefined);

      render(<ProfessorDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Portal del Profesor / Investigador')).toBeInTheDocument();
        expect(screen.getByTestId('professor-assign-card')).toBeInTheDocument();
      });

      const assignButton = screen.getByTestId('submit-assign-button');
      await userEvent.click(assignButton);

      await waitFor(() => {
        expect(assignSpy).toHaveBeenCalledWith(
          mockAssignedCases[0].id,
          '00000000-0000-0000-0000-000000000002'
        );
        expect(screen.getByTestId('assign-success-alert')).toBeInTheDocument();
      });
    });

    it('permite publicar un resultado para el paciente', async () => {
      vi.spyOn(apiClient.internal, 'listAssignedCases').mockResolvedValue(
        mockAssignedCases
      );
      const publishSpy = vi
        .spyOn(apiClient.operations, 'makeResultAvailable')
        .mockResolvedValueOnce(undefined);

      render(<ProfessorDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('professor-publish-card')).toBeInTheDocument();
      });

      const resultInput = screen.getByTestId('result-id-input');
      await userEvent.type(resultInput, '10000000-0000-0000-0000-000000000001');

      const publishButton = screen.getByTestId('submit-publish-button');
      await userEvent.click(publishButton);

      await waitFor(() => {
        expect(publishSpy).toHaveBeenCalledWith(
          '10000000-0000-0000-0000-000000000001'
        );
        expect(screen.getByTestId('publish-success-alert')).toBeInTheDocument();
      });
    });
  });
});
