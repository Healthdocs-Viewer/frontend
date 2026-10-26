import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { InternalCaseSummary } from '../types/api';
import { InternalCaseList } from '../components/internal/InternalCaseList';
import { InternalCaseDetail } from '../components/internal/InternalCaseDetail';
import { ResultUploadCard } from '../components/internal/ResultUploadCard';
import {
  UserPlus,
  Share2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';

/** UUID del estudiante de prueba para pre-poblar el campo de asignación en desarrollo. */
const DEV_STUDENT_UUID = '00000000-0000-0000-0000-000000000002';

export const ProfessorDashboard: React.FC = () => {
  const [cases, setCases] = useState<InternalCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);
  const [pendingCases, setPendingCases] = useState<InternalCaseSummary[]>([]);
  const [selectedPendingCaseId, setSelectedPendingCaseId] = useState<string | null>(null);
  const [isLoadingPendingCases, setIsLoadingPendingCases] = useState<boolean>(true);
  const [pendingCaseLoadError, setPendingCaseLoadError] = useState<string | null>(null);

  // Estados de Asignación de Estudiantes (POST /operations/cases/{caseId}/assignments)
  const [researcherUserId, setResearcherUserId] = useState<string>(DEV_STUDENT_UUID);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [assignErrorMsg, setAssignErrorMsg] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [publishErrorMsg, setPublishErrorMsg] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setIsLoadingCases(true);
    setCaseLoadError(null);
    try {
      const data = await apiClient.internal.listAssignedCases();
      setCases(data);
      if (data.length > 0) {
        setSelectedCaseId((prev) => (prev && data.some((c) => c.id === prev) ? prev : data[0].id));
      } else {
        setSelectedCaseId(null);
      }
    } catch (err: any) {
      console.error('Error al obtener casos del profesor:', err);
      setCaseLoadError(err?.message || 'No fue posible cargar los casos para supervisión.');
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  const fetchPendingCases = useCallback(async () => {
    setIsLoadingPendingCases(true);
    setPendingCaseLoadError(null);
    try {
      const data = await apiClient.operations.listPendingCases();
      setPendingCases(data);
      if (data.length > 0) {
        setSelectedPendingCaseId((prev) =>
          prev && data.some((c) => c.id === prev) ? prev : data[0].id
        );
      } else {
        setSelectedPendingCaseId(null);
      }
    } catch (err: any) {
      console.error('Error al obtener casos pendientes:', err);
      setPendingCaseLoadError(err?.message || 'No fue posible cargar los casos pendientes.');
    } finally {
      setIsLoadingPendingCases(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
    fetchPendingCases();
  }, [fetchCases, fetchPendingCases]);

  const selectedPendingCase =
    pendingCases.find((c) => c.id === selectedPendingCaseId) || null;
  const selectedAssignedCase = cases.find((c) => c.id === selectedCaseId) || null;
  const selectedCase = selectedPendingCase || selectedAssignedCase;

  // 1. Acción de Profesor: Asignar Estudiantes (POST /operations/cases/{caseId}/assignments)
  const handleAssignResearcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !researcherUserId || isAssigning) return;

    setIsAssigning(true);
    setAssignSuccessMsg(null);
    setAssignErrorMsg(null);

    try {
      await apiClient.operations.assignCase(selectedCase.id, researcherUserId);
      setAssignSuccessMsg(`Estudiante habilitado con éxito para el caso (${researcherUserId}).`);
      await Promise.all([fetchPendingCases(), fetchCases()]);
    } catch (err: any) {
      console.error('Error al asignar caso:', err);
      setAssignErrorMsg(err?.message || 'Error al asignar el caso al estudiante.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 2. Acción de Profesor: Publicar Resultados (POST /operations/results/{resultId}/availability)
  const handlePublishResult = async (resultId: string) => {
    if (!resultId || isPublishing) return;

    setIsPublishing(true);
    setPublishSuccessMsg(null);
    setPublishErrorMsg(null);

    try {
      await apiClient.operations.makeResultAvailable(resultId);
      setPublishSuccessMsg('Resultado publicado y disponible para el paciente.');
      fetchCases();
    } catch (err: any) {
      console.error('Error al publicar resultado:', err);
      setPublishErrorMsg(err?.message || 'Error al hacer disponible el resultado.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUploadSuccess = () => {
    if (selectedCaseId) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === selectedCaseId ? { ...c, status: 'RESULT_UPLOADED' } : c
        )
      );
    }
    fetchCases();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal del Profesor / Investigador
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              Rol Profesor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisa casos habilitados, asigna permisos a estudiantes y publica resultados diagnósticos para pacientes.
          </p>
        </div>
        <button
          onClick={() => {
            fetchCases();
            fetchPendingCases();
          }}
          disabled={isLoadingCases || isLoadingPendingCases}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
          <span>Actualizar Casos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Casos pendientes y casos en supervisión */}
        <div className="space-y-6">
          <InternalCaseList
            cases={pendingCases}
            selectedCaseId={selectedPendingCaseId}
            onSelectCase={(id) => {
              setSelectedPendingCaseId(id);
              setSelectedCaseId(null);
              setAssignSuccessMsg(null);
              setAssignErrorMsg(null);
            }}
            isLoading={isLoadingPendingCases}
            errorMessage={pendingCaseLoadError}
            onRetry={fetchPendingCases}
            title="Casos Pendientes de Habilitación"
            badgeLabel="FILES_RECEIVED"
            loadingLabel="Cargando casos pendientes..."
            emptyTitle="No hay casos pendientes"
            emptyDescription="No hay casos FILES_RECEIVED esperando habilitación."
          />
          <InternalCaseList
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => {
              setSelectedPendingCaseId(null);
              setSelectedCaseId(id);
              setAssignSuccessMsg(null);
              setAssignErrorMsg(null);
              setPublishSuccessMsg(null);
              setPublishErrorMsg(null);
            }}
            isLoading={isLoadingCases}
            errorMessage={caseLoadError}
            onRetry={fetchCases}
            title="Casos en Supervisión"
            badgeLabel="Profesor"
          />
        </div>

        {/* Columna Derecha: Detalle, Operaciones Docentes y Carga de Resultado */}
        <div className="lg:col-span-2 space-y-6">
          <InternalCaseDetail selectedCase={selectedCase} onResultDeleted={fetchCases}>
            {selectedCase && (
              <div className="space-y-6 mt-6 pt-6 border-t border-slate-200">
                {/* Operación 1: Asignar Estudiante al Caso */}
                <div
                  data-testid="professor-assign-card"
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-purple-600" />
                      Asignar Caso a Estudiante
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Habilita a un estudiante para consultar insumos y cargar resultados en este caso formativo.
                  </p>

                  {assignSuccessMsg && (
                    <div
                      data-testid="assign-success-alert"
                      className="p-3 rounded-lg text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{assignSuccessMsg}</span>
                    </div>
                  )}

                  {assignErrorMsg && (
                    <div
                      data-testid="assign-error-alert"
                      className="p-3 rounded-lg text-xs flex items-center gap-2 bg-red-50 text-red-800 border border-red-200"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{assignErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleAssignResearcher} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        ID de Usuario del Estudiante (UUID)
                      </label>
                      <input
                        type="text"
                        required
                        data-testid="researcher-userid-input"
                        value={researcherUserId}
                        onChange={(e) => setResearcherUserId(e.target.value)}
                        placeholder="00000000-0000-0000-0000-000000000002"
                        className="block w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        data-testid="submit-assign-button"
                        disabled={isAssigning || !researcherUserId}
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isAssigning ? 'Asignando...' : 'Habilitar Caso para Estudiante'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Operación 2: Publicar Resultado al Paciente */}
                <div
                  data-testid="professor-publish-card"
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
                >
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    Publicar Resultado Diagnóstico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marca un resultado como disponible para que el paciente propietario pueda consultarlo y descargarlo.
                  </p>

                  {publishSuccessMsg && (
                    <div
                      data-testid="publish-success-alert"
                      className="p-3 rounded-lg text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                      <span>{publishSuccessMsg}</span>
                    </div>
                  )}

                  {publishErrorMsg && (
                    <div
                      data-testid="publish-error-alert"
                      className="p-3 rounded-lg text-xs flex items-center gap-2 bg-red-50 text-red-800 border border-red-200"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{publishErrorMsg}</span>
                    </div>
                  )}

                  {selectedCase.result ? (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0 text-xs">
                        <p className="font-semibold text-slate-800 truncate">{selectedCase.result.originalFilename}</p>
                        <p className="text-slate-500 mt-1">
                          Subido {selectedCase.result.uploadedAt ? new Date(selectedCase.result.uploadedAt).toLocaleString() : '—'}
                          {selectedCase.result.uploadedBy ? ` · Por: ${selectedCase.result.uploadedBy}` : ''}
                        </p>
                        <p className="text-slate-500">Estado: {selectedCase.result.status}</p>
                      </div>
                      {selectedCase.result.status === 'UPLOADED' ? (
                        <button
                          type="button"
                          data-testid="submit-publish-button"
                          onClick={() => handlePublishResult(selectedCase.result!.id)}
                          disabled={isPublishing}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {isPublishing ? 'Publicando...' : 'Publicar'}
                        </button>
                      ) : <span className="text-xs font-semibold text-emerald-700">Publicado</span>}
                    </div>
                  ) : <p className="text-xs text-slate-500">Aún no hay resultados cargados para este caso.</p>}
                </div>

                {/* Carga de Resultado por parte del Profesor */}
                <ResultUploadCard
                  caseId={selectedCase.id}
                  caseStatus={selectedCase.status}
                  result={selectedCase.result}
                  disabled={selectedCase.status !== 'ENABLED_FOR_PROCESSING'}
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            )}
          </InternalCaseDetail>
        </div>
      </div>
    </div>
  );
};
