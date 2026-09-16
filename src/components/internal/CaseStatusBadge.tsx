import React from 'react';
import { CaseStatus } from '../../types/api';

interface CaseStatusBadgeProps {
  status: CaseStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  CaseStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  CREATED: {
    label: 'Creado',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  FILES_RECEIVED: {
    label: 'Archivos Recibidos',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  ENABLED_FOR_PROCESSING: {
    label: 'Habilitado para Procesamiento',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-300',
  },
  RESULT_UPLOADED: {
    label: 'Resultado Cargado',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
  },
  RESULT_AVAILABLE: {
    label: 'Resultado Disponible',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
  },
};

export const CaseStatusBadge: React.FC<CaseStatusBadgeProps> = ({ status, className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  };

  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
};
