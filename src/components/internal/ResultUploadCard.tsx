import React, { useState, useRef } from 'react';
import { CaseStatus, CompleteUploadResponse } from '../../types/api';
import { apiClient } from '../../services/apiClient';
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Loader2,
  HelpCircle,
  Download,
} from 'lucide-react';
import { ResultSummary } from '../../types/api';

interface ResultUploadCardProps {
  caseId: string;
  caseStatus?: CaseStatus;
  onUploadSuccess?: (response: CompleteUploadResponse) => void | Promise<void>;
  disabled?: boolean;
  result?: ResultSummary;
}

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'video/mp4',
  'application/dicom',
  'application/zip',
  'application/x-zip-compressed',
]);
const ALLOWED_EXTENSIONS = ['.pdf', '.mp4', '.dcm', '.zip'];

export function validateResultFile(file: File | null): string | null {
  if (!file) {
    return 'Debes seleccionar un archivo para cargar.';
  }

  const filename = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => filename.endsWith(ext));
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;

  // Algunos navegadores no asocian MIME a .dcm o .zip; aceptamos si la extensión o MIME es válida
  if (!hasValidExtension && !hasValidMime) {
    return 'Tipo de archivo no permitido. Solo se aceptan formatos PDF (.pdf), Video (.mp4), DICOM (.dcm) o ZIP (.zip).';
  }

  if (file.size < 1) {
    return 'El archivo seleccionado está vacío (0 bytes).';
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `El archivo supera el tamaño máximo permitido de 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB detectados).`;
  }

  return null;
}

export const ResultUploadCard: React.FC<ResultUploadCardProps> = ({
  caseId,
  caseStatus,
  onUploadSuccess,
  disabled = false,
  result,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    setValidationError(null);
    setUploadError(null);
    setUploadSuccess(false);
    setSuccessMessage(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const error = validateResultFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (disabled || isUploading) return;

    if (!selectedFile) {
      setValidationError('Por favor selecciona un archivo de resultado.');
      return;
    }

    const clientValidationError = validateResultFile(selectedFile);
    if (clientValidationError) {
      setValidationError(clientValidationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setValidationError(null);
    setUploadSuccess(false);
    setSuccessMessage(null);
    setUploadStep('Iniciando intención de carga...');

    try {
      // Paso 1: Crear intención de carga en backend (POST /internal/cases/{caseId}/result-uploads)
      const mimeType = selectedFile.type || (selectedFile.name.endsWith('.mp4') ? 'video/mp4' : 'application/pdf');
      
      const intent = await apiClient.internal.createResultUpload(caseId, {
        originalFilename: selectedFile.name,
        contentType: mimeType,
        sizeBytes: selectedFile.size,
      });
      if (Date.now() >= Date.parse(intent.expiresAt)) {
        throw new Error('La intención de carga expiró. Solicita una nueva carga.');
      }

      // Paso 2: Carga directa a S3 / URL prefirmada con PUT binario
      setUploadStep('Transfiriendo archivo al almacenamiento...');
      const isMockUrl = intent.uploadUrl.startsWith('https://storage.healthdocs.local');
      if (!isMockUrl) {
        const s3Response = await fetch(intent.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
          },
          body: selectedFile,
        });

        if (!s3Response.ok) {
          throw new Error(
            `Fallo en la transferencia de datos (${s3Response.status} ${s3Response.statusText}). La carga no se completó.`
          );
        }
      }

      // Paso 3: Confirmar carga en backend (POST /files/{fileId}/complete)
      setUploadStep('Confirmando asociación del resultado con el caso...');
      const completeRes = await apiClient.files.completeUpload(intent.file.id);

      setUploadSuccess(true);
      setSuccessMessage(
        `Resultado "${selectedFile.name}" asociado exitosamente. El caso cambió de estado a RESULT_UPLOADED.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        void onUploadSuccess(completeRes);
      }
    } catch (err: any) {
      console.error('Error durante la carga de resultado:', err);
      setUploadError(
        err?.message || 'Ocurrió un error al cargar el resultado clínico. Por favor reintenta.'
      );
    } finally {
      setIsUploading(false);
      setUploadStep(null);
    }
  };

  const isAlreadyProcessed = caseStatus === 'RESULT_AVAILABLE';

  const handleDownloadResult = async () => {
    if (!result) return;
    try {
      const intent = await apiClient.internal.createResultDownload(caseId, result.id);
      window.open(intent.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setUploadError(err?.message || 'No fue posible descargar el resultado.');
    }
  };

  return (
    <div
      data-testid="result-upload-card"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <UploadCloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Cargar Resultado Procesado
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Asocia el informe diagnóstico, reconstrucción 3D o video procesado para este caso.
          </p>
        </div>

        {caseStatus && (
          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Estado: {caseStatus}
          </span>
        )}
      </div>

      {isAlreadyProcessed && (
        <div
          data-testid="already-available-notice"
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <HelpCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Este caso ya tiene un resultado publicado y disponible para el paciente. Si cargas uno nuevo, reemplazarás la asociación previa.
          </span>
        </div>
      )}

      {result && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-emerald-900 dark:text-emerald-200" title={result.originalFilename}>
              {result.originalFilename}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Resultado {result.status === 'AVAILABLE' ? 'publicado' : 'cargado'}</p>
          </div>
          <button
            type="button"
            data-testid="download-result-button"
            onClick={handleDownloadResult}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar resultado
          </button>
        </div>
      )}

      {disabled && caseStatus !== 'RESULT_AVAILABLE' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          Primero debes habilitar el caso para procesamiento. La carga de resultados estará disponible cuando el estado sea
          <strong className="ml-1">ENABLED_FOR_PROCESSING</strong>.
        </div>
      )}

      {/* Alerta de Éxito */}
      {uploadSuccess && successMessage && (
        <div
          data-testid="upload-success-alert"
          className="flex items-start justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-fadeIn dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadSuccess(false)}
            className="ml-2 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerta de Error de Validación */}
      {validationError && (
        <div
          data-testid="upload-validation-alert"
          className="flex items-start justify-between rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="ml-2 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alerta de Error de Envío */}
      {uploadError && (
        <div
          data-testid="upload-error-alert"
          className="flex items-start justify-between rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-2 text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Zona de Selección / Dropzone */}
        <div
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            isUploading || disabled
              ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/60'
              : selectedFile
              ? 'border-sky-400 bg-sky-50/30 dark:border-sky-500 dark:bg-sky-950/20'
              : 'border-slate-300 bg-slate-50/40 hover:border-sky-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:border-sky-500 dark:hover:bg-slate-800/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="result-file-input"
            data-testid="result-file-input"
            accept=".pdf,.mp4,.dcm,.zip,application/pdf,video/mp4,application/dicom,application/zip"
            disabled={isUploading || disabled}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-white p-2 text-left shadow-2xs dark:border-sky-900 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p
                    data-testid="selected-file-name"
                    className="truncate text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Tipo detectado por extensión'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="clear-file-button"
                disabled={isUploading}
                onClick={handleClearFile}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Quitar archivo seleccionado"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="result-file-input"
              className={`flex flex-col items-center justify-center cursor-pointer ${
                disabled ? 'cursor-not-allowed' : ''
              }`}
            >
              <UploadCloud className="mb-2 w-8 h-8 text-sky-500 dark:text-sky-400" />
              <span className="text-xs font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
                Haz clic para seleccionar el archivo de resultado
              </span>
              <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Formatos permitidos: PDF, Video MP4, DICOM o ZIP (Máx. 100 MB)
              </span>
            </label>
          )}
        </div>

        {/* Indicador de Progreso por Pasos */}
        {isUploading && uploadStep && (
          <div
            data-testid="upload-progress-indicator"
            className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
          >
            <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-sky-600 dark:text-sky-400" />
            <span className="font-medium">{uploadStep}</span>
          </div>
        )}

        {/* Botón de Envío con Prevención de Doble Envío */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            data-testid="submit-result-button"
            disabled={!selectedFile || isUploading || disabled}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-700 dark:hover:bg-sky-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Procesando envío...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Asociar y Enviar Resultado</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
