import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { InternalCaseSummary, FileSummary } from '../types/api';
import {
  UserPlus,
  Share2,
  CheckCircle,
  FileText,
  Download,
  Clock,
  RefreshCw,
  FolderKanban,
  Send,
} from 'lucide-react';

/** UUID del estudiante de prueba para pre-poblar el campo de asignación en desarrollo. */
const DEV_STUDENT_UUID = 'b0000002-0000-0000-0000-000000000002';

export const ProfessorDashboard: React.FC = () => {
  const [cases, setCases] = useState<InternalCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);

  // Estados de Asignación de Estudiantes (POST /operations/cases/{caseId}/assignments)
  const [studentUserId, setStudentUserId] = useState<string>(DEV_STUDENT_UUID);

  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  // Estados de Publicación de Resultados (POST /operations/results/{resultId}/availability)
  const [resultIdInput, setResultIdInput] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  // Estado de descarga de archivos
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const fetchCases = async () => {
    setIsLoadingCases(true);
    try {
      const data = await apiClient.internal.listAssignedCases();
      setCases(data);
      if (data.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error al obtener casos del profesor:', err);
    } finally {
      setIsLoadingCases(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  // 1. Acción de Profesor: Asignar Estudiantes (POST /operations/cases/{caseId}/assignments)
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId || !studentUserId) return;

    setIsAssigning(true);
    setAssignMessage(null);

    try {
      await apiClient.operations.assignCase(selectedCaseId, studentUserId);
      setAssignMessage(`Estudiante (${studentUserId}) habilitado con éxito para el caso.`);
      fetchCases();
    } catch (err: any) {
      console.error('Error al asignar caso:', err);
      setAssignMessage(err?.message || 'Error al asignar el caso al estudiante.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 2. Acción de Profesor: Publicar Resultados (POST /operations/results/{resultId}/availability)
  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetResultId = resultIdInput.trim();
    if (!targetResultId) return;

    setIsPublishing(true);
    setPublishMessage(null);

    try {
      await apiClient.operations.makeResultAvailable(targetResultId);
      setPublishMessage(`Resultado ${targetResultId} marcado como disponible para el paciente.`);
      setResultIdInput('');
      fetchCases();
    } catch (err: any) {
      console.error('Error al publicar resultado:', err);
      setPublishMessage(err?.message || 'Error al hacer disponible el resultado.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownloadFile = async (caseId: string, fileId: string) => {
    setDownloadingFileId(fileId);
    try {
      const intent = await apiClient.internal.createInputDownload(caseId, fileId);
      window.open(intent.downloadUrl, '_blank');
    } catch (err: any) {
      console.error('Error al descargar archivo:', err);
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal del Profesor
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              Rol Profesor / Investigador
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisa casos habilitados, asigna casos a estudiantes y publica resultados diagnósticos para pacientes.
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
          <span>Actualizar Casos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Casos Habilitados */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-600" />
              Casos en Supervisión ({cases.length})
            </h2>
          </div>

          {isLoadingCases ? (
            <div className="py-8 text-center text-xs text-slate-400">Cargando casos...</div>
          ) : cases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No hay casos disponibles para supervisión.
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[550px]">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    setAssignMessage(null);
                    setPublishMessage(null);
                  }}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedCaseId === c.id
                      ? 'border-purple-500 bg-purple-50/50 shadow-xs'
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
                          : c.status === 'ENABLED_FOR_PROCESSING'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-purple-100 text-purple-800'
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

        {/* Columna Derecha: Acciones del Profesor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCase ? (
            <>
              {/* Sección 1: Asignar Estudiantes (POST /operations/cases/{caseId}/assignments) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-purple-600" />
                    Asignar Caso a Estudiante
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Habilita a un estudiante para acceder a los archivos y cargar el resultado de este caso.
                </p>

                {assignMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                      assignMessage.includes('éxito')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{assignMessage}</span>
                  </div>
                )}

                <form onSubmit={handleAssignStudent} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      ID de Usuario del Estudiante (UUID)
                    </label>
                    <input
                      type="text"
                      required
                      value={studentUserId}
                      onChange={(e) => setStudentUserId(e.target.value)}
                      placeholder="b0000002-0000-0000-0000-000000000002"
                      className="block w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAssigning || !studentUserId}
                      className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAssigning ? 'Asignando...' : 'Habilitar Caso'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Sección 2: Publicar Resultado (POST /operations/results/{resultId}/availability) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  Publicar Resultado Diagnóstico
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Marca un resultado como disponible para que el paciente pueda consultarlo y descargarlo.
                </p>

                {publishMessage && (
                  <div
                    className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                      publishMessage.includes('disponible')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{publishMessage}</span>
                  </div>
                )}

                <form onSubmit={handlePublishResult} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      ID de Resultado (resultId UUID)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={resultIdInput}
                        onChange={(e) => setResultIdInput(e.target.value)}
                        placeholder="r1000000-0000-0000-0000-000000000001"
                        className="block flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setResultIdInput('r1000000-0000-0000-0000-000000000001')}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium border border-slate-200"
                        title="Usar resultado de prueba 1"
                      >
                        Prueba 1
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isPublishing || !resultIdInput}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isPublishing ? 'Publicando...' : 'Publicar y Notificar Paciente'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Sección 3: Archivos del Caso */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Archivos Registrados en el Caso
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-mono">
                  ID: {selectedCase.id}
                </p>

                {selectedCase.files.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    Sin archivos en este caso.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedCase.files.map((file: FileSummary) => (
                      <div
                        key={file.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">
                              {file.originalFilename}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                file.fileKind === 'RESULT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {file.fileKind}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {file.contentType || 'application/octet-stream'} •{' '}
                            {file.sizeBytes
                              ? `${(file.sizeBytes / 1024).toFixed(1)} KB`
                              : ''}
                          </p>
                        </div>
                        {file.fileKind === 'INPUT' && (
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
                                ? 'Generando...'
                                : 'Descargar'}
                            </span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              Selecciona un caso para supervisarlo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
