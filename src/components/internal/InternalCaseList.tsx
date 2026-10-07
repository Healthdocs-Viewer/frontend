import React from 'react';
import { InternalCaseSummary } from '../../types/api';
import { CaseStatusBadge } from './CaseStatusBadge';
import { FolderLock, Clock, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface InternalCaseListProps {
  cases: InternalCaseSummary[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry?: () => void;
  title?: string;
  badgeLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const InternalCaseList: React.FC<InternalCaseListProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  isLoading,
  errorMessage,
  onRetry,
  title = 'Casos Habilitados',
  badgeLabel,
  loadingLabel = 'Cargando casos habilitados...',
  emptyTitle = 'No hay casos habilitados',
  emptyDescription = 'Actualmente no tienes casos clínicos asignados para procesamiento.',
}) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col h-fit">
      {/* Encabezado de la lista */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <FolderLock className="w-4 h-4 text-sky-600" />
          <span>{title}</span>
          {!isLoading && !errorMessage && (
            <span
              data-testid="cases-count-badge"
              className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
            >
              {cases.length}
            </span>
          )}
        </h2>
        {badgeLabel && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
            {badgeLabel}
          </span>
        )}
      </div>

      {/* Estado de Carga (Loading) */}
      {isLoading ? (
        <div data-testid="cases-loading-state" className="space-y-3 py-2">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 animate-pulse space-y-2.5"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-28" />
                <div className="h-4 bg-slate-200 rounded w-20" />
              </div>
              <div className="h-3 bg-slate-200 rounded w-40" />
              <div className="flex justify-between items-center pt-1">
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-3 bg-slate-200 rounded w-14" />
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-slate-400 font-medium pt-2">
            {loadingLabel}
          </p>
        </div>
      ) : errorMessage ? (
        /* Estado de Error */
        <div
          data-testid="cases-error-state"
          className="py-8 px-4 text-center rounded-lg border border-red-200 bg-red-50/50 space-y-3 my-auto"
        >
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <div>
            <p className="text-xs font-semibold text-red-800">Error al consultar los casos</p>
            <p className="text-[11px] text-red-600 mt-1">{errorMessage}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reintentar</span>
            </button>
          )}
        </div>
      ) : cases.length === 0 ? (
        /* Estado Vacío (Empty) */
        <div
          data-testid="cases-empty-state"
          className="py-12 px-4 text-center rounded-lg border border-dashed border-slate-200 space-y-2 my-auto"
        >
          <FolderLock className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">{emptyTitle}</p>
          <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
            {emptyDescription}
          </p>
        </div>
      ) : (
        /* Listado de Casos */
        <div
          data-testid="cases-list-items"
          className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px] pr-1"
        >
          {cases.map((c) => {
            const isSelected = selectedCaseId === c.id;
            const inputFilesCount = c.files.filter((f) => f.fileKind === 'INPUT').length;

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                data-testid={`case-item-${c.id}`}
                onClick={() => onSelectCase(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCase(c.id);
                  }
                }}
                className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/60 shadow-xs ring-1 ring-sky-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {c.referenceCode || c.id}
                  </span>
                  <CaseStatusBadge status={c.status} />
                </div>

                <div className="mt-1.5 text-[11px] text-slate-600 font-medium truncate">
                  {c.studyName || 'Estudio clínico'}
                </div>

                <div className="mt-1 text-[10px] font-mono text-slate-400 truncate" title={c.id}>
                  ID: {c.id}
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <FileText className="w-3 h-3 text-slate-400" />
                    {inputFilesCount} insumo(s)
                  </span>
                </div>
                {inputFilesCount > 0 && (
                  <div className="mt-1.5 text-[10px] text-slate-400 truncate" title={c.files
                    .filter((file) => file.fileKind === 'INPUT')
                    .map((file) => file.originalFilename)
                    .join(', ')}
                  >
                    INPUT: {c.files
                      .filter((file) => file.fileKind === 'INPUT')
                      .map((file) => file.originalFilename)
                      .join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
