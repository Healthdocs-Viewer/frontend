import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ResultUploadCard,
  validateResultFile,
} from '../components/internal/ResultUploadCard';
import { apiClient } from '../services/apiClient';

describe('Etapa 2: Carga de Resultado Externo y Validaciones', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Función validateResultFile', () => {
    it('rechaza archivos nulos', () => {
      expect(validateResultFile(null)).toContain('Debes seleccionar un archivo');
    });

    it('rechaza archivos con 0 bytes de tamaño', () => {
      const emptyFile = new File([''], 'informe.pdf', { type: 'application/pdf' });
      expect(validateResultFile(emptyFile)).toContain('está vacío (0 bytes)');
    });

    it('rechaza extensiones o tipos no permitidos', () => {
      const exeFile = new File(['dummy content'], 'script.exe', {
        type: 'application/x-msdownload',
      });
      expect(validateResultFile(exeFile)).toContain('Tipo de archivo no permitido');

      const txtFile = new File(['dummy content'], 'notas.txt', { type: 'text/plain' });
      expect(validateResultFile(txtFile)).toContain('Tipo de archivo no permitido');
    });

    it('rechaza archivos que superan los 100 MB', () => {
      const oversizedFile = new File(['a'], 'video_pesado.mp4', { type: 'video/mp4' });
      Object.defineProperty(oversizedFile, 'size', { value: 100 * 1024 * 1024 + 10 });

      expect(validateResultFile(oversizedFile)).toContain('supera el tamaño máximo');
    });

    it('acepta archivos válidos con extensión y tipo permitido', () => {
      const validPdf = new File(['pdf-data'], 'reconstruccion.pdf', {
        type: 'application/pdf',
      });
      expect(validateResultFile(validPdf)).toBeNull();

      const validMp4 = new File(['mp4-data'], 'render3d.mp4', {
        type: 'video/mp4',
      });
      expect(validateResultFile(validMp4)).toBeNull();

      const validDcm = new File(['dicom-data'], 'estudio.dcm', {
        type: 'application/dicom',
      });
      expect(validateResultFile(validDcm)).toBeNull();

      const validZip = new File(['zip-data'], 'paquete.zip', {
        type: 'application/zip',
      });
      expect(validateResultFile(validZip)).toBeNull();
    });
  });

  describe('Componente ResultUploadCard', () => {
    const caseId = 'c1000000-0000-0000-0000-000000000001';

    it('renderiza el formulario con dropzone y botón deshabilitado inicialmente', () => {
      render(<ResultUploadCard caseId={caseId} caseStatus="ENABLED_FOR_PROCESSING" />);

      expect(screen.getByTestId('result-upload-card')).toBeInTheDocument();
      expect(
        screen.getByText(/Haz clic para seleccionar el archivo de resultado/i)
      ).toBeInTheDocument();
      expect(screen.getByTestId('submit-result-button')).toBeDisabled();
    });

    it('muestra alerta de validación si se selecciona un tipo inválido', async () => {
      render(<ResultUploadCard caseId={caseId} />);

      const fileInput = screen.getByTestId('result-file-input');
      const invalidFile = new File(['contenido'], 'foto.png', { type: 'image/png' });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(screen.getByTestId('upload-validation-alert')).toBeInTheDocument();
      expect(screen.getByText(/Tipo de archivo no permitido/i)).toBeInTheDocument();
      expect(screen.getByTestId('submit-result-button')).toBeDisabled();
    });

    it('muestra el archivo seleccionado y permite removerlo', async () => {
      render(<ResultUploadCard caseId={caseId} />);

      const fileInput = screen.getByTestId('result-file-input');
      const validFile = new File(['contenido-valido'], 'reconstruccion.pdf', {
        type: 'application/pdf',
      });

      await userEvent.upload(fileInput, validFile);

      expect(screen.getByTestId('selected-file-name')).toHaveTextContent(
        'reconstruccion.pdf'
      );
      expect(screen.getByTestId('submit-result-button')).toBeEnabled();

      const clearBtn = screen.getByTestId('clear-file-button');
      await userEvent.click(clearBtn);

      expect(screen.queryByTestId('selected-file-name')).not.toBeInTheDocument();
      expect(screen.getByTestId('submit-result-button')).toBeDisabled();
    });

    it('ejecuta el ciclo de 3 pasos (intención, PUT y confirmación) y previene doble submit', async () => {
      const onUploadSuccess = vi.fn();
      const mockIntent = {
        file: {
          id: 'f-result-001',
          originalFilename: 'reconstruccion.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024,
          fileKind: 'RESULT' as const,
        },
        uploadUrl: 'https://storage.healthdocs.local/results/f-result-001',
        expiresAt: '2099-09-16T18:00:00Z',
      };

      const mockCompleteResponse = {
        file: mockIntent.file,
        caseStatus: 'RESULT_UPLOADED' as const,
      };

      const createUploadSpy = vi
        .spyOn(apiClient.internal, 'createResultUpload')
        .mockResolvedValueOnce(mockIntent);
      const completeUploadSpy = vi
        .spyOn(apiClient.files, 'completeUpload')
        .mockResolvedValueOnce(mockCompleteResponse);

      render(
        <ResultUploadCard
          caseId={caseId}
          caseStatus="ENABLED_FOR_PROCESSING"
          onUploadSuccess={onUploadSuccess}
        />
      );

      const fileInput = screen.getByTestId('result-file-input');
      const validFile = new File(['data'], 'reconstruccion.pdf', {
        type: 'application/pdf',
      });
      await userEvent.upload(fileInput, validFile);

      const submitBtn = screen.getByTestId('submit-result-button');
      await userEvent.click(submitBtn);

      // Durante la carga, el botón debe estar deshabilitado
      expect(submitBtn).toBeDisabled();

      await waitFor(() => {
        expect(createUploadSpy).toHaveBeenCalledWith(
          caseId,
          expect.objectContaining({
            originalFilename: 'reconstruccion.pdf',
            contentType: 'application/pdf',
          })
        );
        expect(completeUploadSpy).toHaveBeenCalledWith('f-result-001');
        expect(screen.getByTestId('upload-success-alert')).toBeInTheDocument();
        expect(onUploadSuccess).toHaveBeenCalledWith(mockCompleteResponse);
      });
    });

    it('muestra alerta de error si el servidor rechaza la intención o confirmación', async () => {
      vi.spyOn(apiClient.internal, 'createResultUpload').mockRejectedValueOnce(
        new Error('El caso ya cuenta con resultado asociado (409 Conflict)')
      );

      render(<ResultUploadCard caseId={caseId} />);

      const fileInput = screen.getByTestId('result-file-input');
      const validFile = new File(['data'], 'reconstruccion.pdf', {
        type: 'application/pdf',
      });
      await userEvent.upload(fileInput, validFile);

      const submitBtn = screen.getByTestId('submit-result-button');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('upload-error-alert')).toHaveTextContent(
          'El caso ya cuenta con resultado asociado (409 Conflict)'
        );
      });
    });

    it('muestra aviso preventivo cuando el caso ya tiene resultado disponible', () => {
      render(<ResultUploadCard caseId={caseId} caseStatus="RESULT_AVAILABLE" />);

      expect(screen.getByTestId('already-available-notice')).toBeInTheDocument();
      expect(
        screen.getByText(/Este caso ya tiene un resultado publicado y disponible/i)
      ).toBeInTheDocument();
    });
  });
});
