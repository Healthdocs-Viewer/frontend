import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { InternalCaseSummary } from '../types/api';
import { InternalCaseList } from '../components/internal/InternalCaseList';
import { InternalCaseDetail } from '../components/internal/InternalCaseDetail';
import { ResultUploadCard } from '../components/internal/ResultUploadCard';
import { RefreshCw, GraduationCap } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [cases, setCases] = useState<InternalCaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);

  const fetchAssignedCases = useCallback(async () => {
    setIsLoadingCases(true);
    setCaseLoadError(null);
    try {
      const data = await apiClient.internal.listAssignedCases();
      setCases(data);
      // Seleccionar automáticamente el primer caso si no hay ninguno seleccionado
      if (data.length > 0) {
        setSelectedCaseId((prev) => (prev && data.some((c) => c.id === prev) ? prev : data[0].id));
      } else {
        setSelectedCaseId(null);
      }
    } catch (err: any) {
      console.error('Error al listar casos asignados:', err);
      setCaseLoadError(err?.message || 'No fue posible cargar los casos habilitados.');
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignedCases();
  }, [fetchAssignedCases]);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null;

  const handleUploadSuccess = () => {
    // Actualización visual reactiva inmediata del estado en la lista local
    if (selectedCaseId) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === selectedCaseId ? { ...c, status: 'RESULT_UPLOADED' } : c
        )
      );
    }
    // Revalidar con el servidor en segundo plano
    fetchAssignedCases();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Encabezado del Portal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal del Estudiante
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
              Rol Estudiante
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consulta casos clínicos habilitados para análisis formativo, descarga insumos y asocia resultados diagnósticos procesados.
          </p>
        </div>
        <button
          onClick={fetchAssignedCases}
          disabled={isLoadingCases}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCases ? 'animate-spin' : ''}`} />
          <span>Actualizar Casos</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Listado de Casos Habilitados */}
        <div>
          <InternalCaseList
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => setSelectedCaseId(id)}
            isLoading={isLoadingCases}
            errorMessage={caseLoadError}
            onRetry={fetchAssignedCases}
            title="Casos Asignados"
            badgeLabel="Estudiante"
          />
        </div>

        {/* Columna Derecha: Detalle del Caso y Carga de Resultado */}
        <div className="lg:col-span-2">
          <InternalCaseDetail selectedCase={selectedCase}>
            {selectedCase && (
              <ResultUploadCard
                caseId={selectedCase.id}
                caseStatus={selectedCase.status}
                onUploadSuccess={handleUploadSuccess}
              />
            )}
          </InternalCaseDetail>
        </div>
      </div>
    </div>
  );
};
