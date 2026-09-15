import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { InternalCaseSummary, FileSummary } from '../types/api';
import {
  FileText,
  Download,
  UploadCloud,
  CheckCircle,
  Clock,
  RefreshCw,
  FolderLock,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [cases, setCases] = useState<InternalCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);

  // Estados de carga de resultado — separados éxito/error para no buscar palabras en strings
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [isUploadingResult, setIsUploadingResult] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);


  // Estado de descarga de archivos
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const fetchAssignedCases = async () => {
    setIsLoadingCases(true);
    try {
      const data = await apiClient.internal.listAssignedCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error al listar casos asignados:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchAssignedCases();
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // 1. Acción de Estudiante: Descargar Archivos de Entrada (POST /internal/cases/{caseId}/files/{fileId}/download)
  const handleDownloadFile = async (caseId: string, fileId: string) => {
    setDownloadingFileId(fileId);
    try {
      const intent = await apiClient.internal.createInputDownload(caseId, fileId);
      window.open(intent.downloadUrl, '_blank');
    } catch (err: any) {
      console.error('Error al obtener URL de descarga:', err);
    } finally {
      setDownloadingFileId(null);
    }
  };

  // 2. Acción de Estudiante: Cargar Resultado (POST /internal/cases/{caseId}/result-uploads + PUT + POST /files/{fileId}/complete)
  const handleUploadResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !resultFile) return;

    setIsUploadingResult(true);
    setUploadSuccess(false);
    setUploadSuccessMsg(null);
    setUploadError(null);

    try {
      // Paso 1: Intención de carga de resultado
      const intent = await apiClient.internal.createResultUpload(selectedCaseId, {
        originalFilename: resultFile.name,
        contentType: resultFile.type || 'video/mp4',
        sizeBytes: resultFile.size,
      });

      // Paso 2: Carga directa a S3 mediante URL prefirmada.
      // Solo omitir en URLs mock de desarrollo.
      const isMockUrl = intent.uploadUrl.startsWith('https://storage.healthdocs.local');
      if (!isMockUrl) {
        const s3Res = await fetch(intent.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': resultFile.type || 'video/mp4' },
          body: resultFile,
        });
        if (!s3Res.ok) {
          throw new Error(
            `Error al transferir el resultado al almacenamiento (${s3Res.status} ${s3Res.statusText}). ` +
            'La carga no se ha confirmado.'
          );
        }
      }

      // Paso 3: Confirmar carga del resultado. Si falla, lanza excepción → no mostrar éxito.
      await apiClient.files.completeUpload(intent.file.id);

      setUploadSuccess(true);
      setUploadSuccessMsg(
        `Resultado "${intent.file.originalFilename}" cargado exitosamente. Queda pendiente de revisión por el profesor.`
      );
      setResultFile(null);
      fetchAssignedCases();
    } catch (err: any) {
      console.error('Error al cargar resultado:', err);
      setUploadSuccess(false);
      setUploadError(err?.message || 'Error al cargar el resultado. Inténtalo de nuevo.');
    } finally {
      setIsUploadingResult(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal del Estudiante
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
              Rol Estudiante
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consulta casos habilitados para análisis formativo, descarga insumos clínicos y carga resultados procesados.
          </p>
        </div>
        <button
          onClick={fetchAssignedCases}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
          <span>Actualizar Casos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Casos Asignados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-sky-600" />
              Casos Asignados ({cases.length})
            </h2>
          </div>

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando casos asignados...</div>
          ) : cases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No tienes casos habilitados para tu usuario. Solicita asignación al profesor.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setUploadSuccess(false);
                    setUploadSuccessMsg(null);
                    setUploadError(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedCaseId === c.id
                      ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-700 truncate max-w-[170px]">
                      {c.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.status === 'RESULT_AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'RESULT_UPLOADED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <span>{c.files.length} archivo(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalle del Caso Seleccionado */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCase ? (
            <>
              {/* Sección 1: Archivos Insumo del Caso (Descarga) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Archivos de Entrada del Caso
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-mono">
                  ID: {selectedCase.id}
                </p>

                {selectedCase.files.filter((f) => f.fileKind === 'INPUT').length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Este caso no contiene archivos de entrada cargados aún.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedCase.files
                      .filter((f) => f.fileKind === 'INPUT')
                      .map((file: FileSummary) => (
                        <div
                          key={file.id}
                          className="py-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {file.originalFilename}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Tipo: {file.contentType || 'Desconocido'} •{' '}
                              {file.sizeBytes
                                ? `${(file.sizeBytes / 1024).toFixed(1)} KB`
                                : 'Tamaño no registrado'}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              handleDownloadFile(selectedCase.id, file.id)
                            }
                            disabled={downloadingFileId === file.id}
                            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {downloadingFileId === file.id
                                ? 'Generando enlace...'
                                : 'Descargar Insumo'}
                            </span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Sección 2: Carga de Resultado */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-sky-600" />
                  Cargar Resultado Procesado
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Carga el informe o video de reconstrucción diagnóstica para este caso.
                </p>

                {/* Mensaje de éxito */}
                {uploadSuccess && uploadSuccessMsg && (
                  <div className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}

                {/* Mensaje de error */}
                {uploadError && (
                  <div className="mb-4 p-3 rounded-lg text-xs flex items-center gap-2 bg-red-50 text-red-800 border border-red-200">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <form onSubmit={handleUploadResult} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors">
                    <input
                      type="file"
                      id="result-file-input"
                      onChange={(e) => setResultFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="result-file-input"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                        {resultFile
                          ? resultFile.name
                          : 'Seleccionar archivo de resultado (ej. video MP4, informe)'}
                      </span>
                      {resultFile && (
                        <span className="text-[11px] text-slate-500 mt-1">
                          {(resultFile.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!resultFile || isUploadingResult}
                      className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingResult ? 'Cargando resultado...' : 'Cargar Resultado'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              Selecciona un caso asignado para ver sus archivos y cargar un resultado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
