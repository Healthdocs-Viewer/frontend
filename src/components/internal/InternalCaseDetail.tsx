import React, { useState } from 'react';
import { InternalCaseSummary, FileSummary } from '../../types/api';
import { apiClient } from '../../services/apiClient';
import { CaseStatusBadge } from './CaseStatusBadge';
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Hash,
  FileCheck,
} from 'lucide-react';

interface InternalCaseDetailProps {
  selectedCase: InternalCaseSummary | null;
  children?: React.ReactNode;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Tamaño no registrado';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export const InternalCaseDetail: React.FC<InternalCaseDetailProps> = ({
  selectedCase,
  children,
}) => {
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  if (!selectedCase) {
    return (
      <div
        data-testid="no-case-selected"
        className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-3"
      >
        <Layers className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Ningún caso seleccionado</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Selecciona un caso habilitado de la lista lateral para consultar sus insumos clínicos y cargar resultados.
        </p>
      </div>
    );
  }

  const inputFiles = selectedCase.files.filter((f) => f.fileKind === 'INPUT');
  const resultFiles = selectedCase.files.filter((f) => f.fileKind === 'RESULT');

  const handleDownloadInputFile = async (file: FileSummary) => {
    if (downloadingFileId) return; // Prevención de descarga concurrente
    setDownloadingFileId(file.id);
    setDownloadError(null);
    setDownloadSuccessMsg(null);

    try {
      const intent = await apiClient.internal.createInputDownload(selectedCase.id, file.id);
      if (intent?.downloadUrl) {
        window.open(intent.downloadUrl, '_blank', 'noopener,noreferrer');
        setDownloadSuccessMsg(`Enlace de descarga generado para "${file.originalFilename}".`);
      } else {
        throw new Error('No se recibió la URL de descarga.');
      }
    } catch (err: any) {
      console.error('Error al generar URL de descarga:', err);
      setDownloadError(
        err?.message || `No fue posible descargar el archivo "${file.originalFilename}".`
      );
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de Confirmación Visible del Caso Seleccionado */}
      <div
        data-testid="selected-case-confirmation"
        className="bg-white p-6 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-white to-sky-50/30 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold tracking-wider text-sky-700 uppercase">
                Caso Seleccionado para Análisis
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {selectedCase.referenceCode || selectedCase.id}
              </h3>
            </div>
          </div>
          <CaseStatusBadge status={selectedCase.status} />
        </div>

        {/* Metadatos Clave del Caso */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Tipo de Estudio
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {selectedCase.studyType ? selectedCase.studyType.replace(/_/g, ' ') : 'No especificado'}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Fecha de Registro
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {new Date(selectedCase.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
              <Hash className="w-3 h-3 text-slate-400" />
              Identificador Técnico
            </span>
            <p className="font-mono text-[11px] text-slate-600 truncate mt-0.5" title={selectedCase.id}>
              {selectedCase.id}
            </p>
          </div>
        </div>
      </div>

      {/* Alertas de Descarga */}
      {downloadSuccessMsg && (
        <div
          data-testid="download-success-alert"
          className="p-3 rounded-lg text-xs flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{downloadSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDownloadSuccessMsg(null)}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold ml-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {downloadError && (
        <div
          data-testid="download-error-alert"
          className="p-3 rounded-lg text-xs flex items-center justify-between bg-red-50 text-red-800 border border-red-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-[11px] text-red-700 hover:text-red-900 font-semibold ml-2"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Sección 1: Archivos Insumo del Caso (Descarga) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              Insumos Clínicos de Entrada ({inputFiles.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Archivos aportados por el paciente para procesamiento y reconstrucción.
            </p>
          </div>
        </div>

        {inputFiles.length === 0 ? (
          <div
            data-testid="no-input-files"
            className="py-6 px-4 text-center rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs italic"
          >
            Este caso no contiene archivos de entrada cargados aún.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {inputFiles.map((file) => {
              const isDownloading = downloadingFileId === file.id;
              return (
                <div
                  key={file.id}
                  data-testid={`input-file-row-${file.id}`}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 truncate" title={file.originalFilename}>
                        {file.originalFilename}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Insumo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      MIME: {file.contentType || 'application/octet-stream'} • {formatBytes(file.sizeBytes)}
                    </p>
                  </div>

                  <button
                    data-testid={`download-button-${file.id}`}
                    type="button"
                    onClick={() => handleDownloadInputFile(file)}
                    disabled={isDownloading || downloadingFileId !== null}
                    className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>{isDownloading ? 'Generando descarga...' : 'Descargar Insumo'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Resumen de resultados ya existentes si aplica */}
        {resultFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              Resultados Registrados ({resultFiles.length})
            </h4>
            <div className="divide-y divide-slate-100 border border-emerald-100 bg-emerald-50/30 rounded-lg">
              {resultFiles.map((resFile) => (
                <div key={resFile.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{resFile.originalFilename}</p>
                    <p className="text-[11px] text-slate-500">
                      {resFile.contentType || 'Resultado'} • {formatBytes(resFile.sizeBytes)}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Cargado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ranura para contenido adicional (Carga de resultados, operaciones) */}
      {children}
    </div>
  );
};
