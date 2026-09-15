import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { CaseSummary, PatientResult } from '../types/api';
import {
  FolderPlus,
  UploadCloud,
  FileCheck,
  Clock,
  Download,
  AlertCircle,
  RefreshCw,
  FileText,
  CheckCircle,
  Loader2,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { token } = useAuth();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);
  const [isCreatingCase, setIsCreatingCase] = useState<boolean>(false);

  // Estados de carga de archivos — separados éxito/error para no buscar palabras en strings
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estados de consulta de resultado
  const [patientResult, setPatientResult] = useState<PatientResult | null>(null);
  const [isCheckingResult, setIsCheckingResult] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const data = await apiClient.patient.listMyCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error al listar casos:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Acción: Crear Caso (POST /cases)
  const handleCreateCase = async () => {
    setIsCreatingCase(true);
    try {
      const newCase = await apiClient.patient.createCase();
      setCases((prev) => [newCase, ...prev]);
      setSelectedCaseId(newCase.id);
      setUploadSuccess(false);
      setUploadSuccessMsg(null);
      setUploadError(null);
      setPatientResult(null);
      setResultMessage(null);
    } catch (err: any) {
      console.error('Error al crear caso:', err);
    } finally {
      setIsCreatingCase(false);
    }
  };

  /**
   * Acción: Cargar Archivos (POST /cases/{caseId}/uploads + PUT + POST /files/{fileId}/complete)
   *
   * Flujo seguro:
   * 1. Verificar sesión activa antes de iniciar.
   * 2. Obtener intención de carga del backend.
   * 3. Transferir a S3 con URL prefirmada. Si falla en modo real → abortar (no llamar complete).
   * 4. Confirmar al backend. Si falla → mostrar error, nunca mostrar éxito.
   * 5. Solo mostrar confirmación cuando completeUpload() resuelve exitosamente.
   */
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !uploadFile) return;

    // Verificar sesión activa
    if (!token) {
      setUploadError('Sin sesión activa. Por favor vuelve a iniciar sesión.');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadSuccessMsg(null);
    setUploadError(null);

    try {
      // Paso 1: Intención de carga en el backend (POST /cases/{caseId}/uploads)
      const uploadIntent = await apiClient.patient.createInputUpload(selectedCaseId, {
        originalFilename: uploadFile.name,
        contentType: uploadFile.type || 'application/octet-stream',
        sizeBytes: uploadFile.size,
      });

      // Paso 2: Transferencia directa con URL prefirmada.
      // Solo omitir la transferencia real en URLs mock de desarrollo.
      const isMockUrl = uploadIntent.uploadUrl.startsWith('https://storage.healthdocs.local');
      if (!isMockUrl) {
        const s3Res = await fetch(uploadIntent.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': uploadFile.type || 'application/octet-stream',
          },
          body: uploadFile,
        });
        if (!s3Res.ok) {
          throw new Error(
            `Error al transferir el archivo al almacenamiento (${s3Res.status} ${s3Res.statusText}). ` +
            'La carga no se ha confirmado.'
          );
        }
      }

      // Paso 3: Confirmar carga al servidor (POST /files/{fileId}/complete).
      // Si esto falla, se lanza la excepción y no se muestra éxito.
      const completedFile = await apiClient.files.completeUpload(uploadIntent.file.id);

      // Solo llegar aquí si completeUpload resolvió correctamente.
      setUploadSuccess(true);
      setUploadSuccessMsg(
        `Archivo "${completedFile.originalFilename}" cargado y confirmado con éxito.`
      );
      setUploadFile(null);
      fetchCases();
    } catch (err: any) {
      console.error('Error al cargar archivo:', err);
      setUploadSuccess(false);
      setUploadError(err?.message || 'Error durante la carga del archivo. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  // Acción: Consultar Resultado (GET /cases/{caseId}/result)
  const handleCheckResult = async (caseId: string) => {
    setIsCheckingResult(true);
    setPatientResult(null);
    setResultMessage(null);

    try {
      const res = await apiClient.patient.getPatientResult(caseId);
      setPatientResult(res);
    } catch (err: any) {
      if (err?.code === 'NOT_FOUND' || err?.status === 404) {
        setResultMessage('El resultado aún no está disponible para este caso.');
      } else {
        setResultMessage(err?.message || 'No fue posible consultar el resultado.');
      }
    } finally {
      setIsCheckingResult(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Portal del Paciente
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona tus casos clínicos, carga documentos y consulta resultados diagnósticos.
          </p>
        </div>
        <button
          onClick={handleCreateCase}
          disabled={isCreatingCase}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          <FolderPlus className="w-4 h-4" />
          <span>{isCreatingCase ? 'Creando caso...' : 'Crear Nuevo Caso'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Lista de Casos del Paciente */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Mis Casos ({cases.length})
            </h2>
            <button
              onClick={fetchCases}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
              title="Refrescar casos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando casos...</div>
          ) : cases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No tienes casos registrados. Haz clic en "Crear Nuevo Caso".
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setPatientResult(null);
                    setResultMessage(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedCaseId === c.id
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
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
                          : c.status === 'FILES_RECEIVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(c.createdAt).toLocaleDateString()}{' '}
                      {new Date(c.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Central y Derecha: Acciones del Caso Seleccionado */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCaseId ? (
            <>
              {/* Sección: Cargar Archivos de Entrada */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  Cargar Archivo al Caso
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Caso seleccionado:{' '}
                  <span className="font-mono text-indigo-600">{selectedCaseId}</span>
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
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                    <input
                      type="file"
                      id="file-input"
                      onChange={(e) => {
                        setUploadFile(e.target.files?.[0] || null);
                        setUploadSuccess(false);
                        setUploadSuccessMsg(null);
                        setUploadError(null);
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="file-input"
                      className={`cursor-pointer flex flex-col items-center ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        {uploadFile ? uploadFile.name : 'Seleccionar archivo (DICOM, imágenes, etc.)'}
                      </span>
                      {uploadFile && (
                        <span className="text-[11px] text-slate-500 mt-1">
                          {(uploadFile.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!uploadFile || isUploading}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cargando y confirmando...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Iniciar Carga</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sección: Consultar Resultado */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Consultar Resultado Diagnóstico
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Verifica si el profesor o estudiante ha emitido y publicado el resultado del caso.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckResult(selectedCaseId)}
                    disabled={isCheckingResult}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingResult ? 'animate-spin' : ''}`} />
                    <span>Consultar</span>
                  </button>
                </div>

                {resultMessage && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{resultMessage}</span>
                  </div>
                )}

                {patientResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                        <FileCheck className="w-4 h-4" />
                        <span>¡Resultado Disponible!</span>
                      </div>
                      <span className="text-[11px] text-emerald-600">
                        Publicado: {new Date(patientResult.availableAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-emerald-700">
                      El informe y resultado médico se encuentran listos para descarga segura.
                    </p>

                    <div className="pt-2">
                      <a
                        href={patientResult.download.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar Resultado Temporal</span>
                      </a>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        Expira:{' '}
                        {new Date(patientResult.download.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              Selecciona o crea un caso para gestionar archivos o consultar resultados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
