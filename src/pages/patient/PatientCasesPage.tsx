import React from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { NavLink } from "react-router-dom";
import { getPatientCases } from "../../services/patientCases";
import { useAuth } from "../../context/AuthContext";
import { getPatientCasePath } from "../../utils/patientCaseNavigation";
import type {
  PatientCaseCreationStage,
  PatientCaseFilter,
  PatientCaseItem,
  PatientCasesResponse,
} from "../../types/patientCases";

const filters: Array<{
  label: string;
  status: PatientCaseFilter | null;
  count: keyof PatientCasesResponse["statusCounts"];
}> = [
  { label: "Todos", status: null, count: "ALL" },
  { label: "Pendientes", status: "PENDING", count: "PENDING" },
  { label: "En procesamiento", status: "IN_PROGRESS", count: "IN_PROGRESS" },
  {
    label: "Resultado disponible",
    status: "RESULT_AVAILABLE",
    count: "RESULT_AVAILABLE",
  },
];

function getStatusConfig(item: PatientCaseItem) {
  const creationStageLabels: Record<PatientCaseCreationStage, string> = {
    INFORMATION_PENDING: "Información pendiente",
    CONSENT_PENDING: "Consentimiento pendiente",
    FILE_PENDING: "Archivo pendiente",
    CONFIRMATION_PENDING: "Confirmación pendiente",
  };
  if (item.creationStage)
    return {
      label: creationStageLabels[item.creationStage],
      icon: Clock3,
      variant: "default" as const,
      action: "Continuar",
    };
  if (item.status === "CREATED")
    return {
      label: "Caso creado",
      icon: Clock3,
      variant: "default" as const,
      action: "Continuar",
    };
  if (item.status === "FILES_RECEIVED")
    return {
      label: "Archivos recibidos",
      icon: CheckCircle2,
      variant: "neutral" as const,
      action: "Ver caso",
    };
  if (item.status === "INPUT_CHANGE_DRAFT")
    return {
      label: "Solicitud de cambio en edición",
      icon: Clock3,
      variant: "default" as const,
      action: "Continuar cambio",
    };
  if (item.status === "INPUT_CHANGE_REVIEW")
    return {
      label: "Solicitud de cambio en revisión",
      icon: Clock3,
      variant: "warning" as const,
      action: "Ver caso",
    };
  if (item.status === "RESULT_UPLOADED")
    return {
      label: "Resultado cargado",
      icon: Clock3,
      variant: "warning" as const,
      action: "Ver caso",
    };
  if (item.status === "RESULT_AVAILABLE" && item.availableResultId)
    return {
      label: "Resultado disponible",
      icon: CheckCircle2,
      variant: "success" as const,
      action: "Ver resultado",
    };
  return {
    label: "En procesamiento",
    icon: Clock3,
    variant: "warning" as const,
    action: "Ver caso",
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

export const PatientCasesPage: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [activeFilter, setActiveFilter] =
    React.useState<PatientCaseFilter | null>(null);
  const [page, setPage] = React.useState(1);
  const [ascending, setAscending] = React.useState(false);
  const [response, setResponse] = React.useState<PatientCasesResponse | null>(
    null,
  );
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);
  React.useEffect(() => {
    let active = true;
    setError("");
    setResponse(null);
    if (query !== debouncedQuery) {
      return () => {
        active = false;
      };
    }
    getPatientCases({
      q: debouncedQuery,
      status: activeFilter ?? undefined,
      sort: ascending ? "createdAt:asc" : "createdAt:desc",
      page: page - 1,
      size: 10,
    })
      .then((data) => {
        if (active) setResponse(data);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los casos.");
      });
    return () => {
      active = false;
    };
  }, [query, debouncedQuery, activeFilter, ascending, page]);
  const pageCount = response?.totalPages ?? 0;
  const changeFilter = (filter: PatientCaseFilter | null) => {
    setActiveFilter(filter);
    setPage(1);
  };
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
              Mis casos
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Consulta el estado de tus estudios y resultados.
            </p>
          </div>
          {user?.role === "patient" && (
            <NavLink
              to="/mis_casos/nuevo"
              className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:mt-0"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Crear nuevo caso
            </NavLink>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por código o estudio"
                aria-label="Buscar casos"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
              />
            </label>
            <Button
              variant="outline"
              onClick={() => {
                setAscending((current) => !current);
                setPage(1);
              }}
              className="justify-between lg:w-48"
            >
              Ordenar: {ascending ? "más antiguos" : "más recientes"}{" "}
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.label}
                size="sm"
                variant={
                  activeFilter === filter.status ? "outline" : "secondary"
                }
                onClick={() => changeFilter(filter.status)}
                className={cn(
                  activeFilter === filter.status &&
                    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
                )}
              >
                {filter.label}{" "}
                <span className="ml-1 text-xs opacity-70">
                  ({response?.statusCounts[filter.count] ?? 0})
                </span>
              </Button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[1060px] table-fixed text-left">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Identificador del caso</th>
                  <th className="px-4 py-3">Estudio</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Última actualización
                  </th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {response?.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No se encontraron casos.
                    </td>
                  </tr>
                ) : (
                  response?.items.map((item) => {
                    const config = getStatusConfig(item);
                    const Icon = config.icon;
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 text-sm dark:border-slate-700"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800 dark:text-slate-100">
                          {item.referenceCode}
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-2">
                            <FileText
                              className="h-4 w-4 shrink-0 text-slate-400"
                              aria-hidden="true"
                            />
                            {item.studyName}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={config.variant}
                            className="w-fit gap-1.5 border-0"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <NavLink
                            to={getPatientCasePath(item.id, item.referenceCode, item.status, item.creationStage)}
                            aria-label={`${config.action}: ${item.referenceCode}`}
                            title={`${config.action}: ${item.referenceCode}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-200"
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </NavLink>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!response && !error && (
            <p role="status" className="mt-4 text-sm text-slate-500">
              Cargando casos…
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando {response?.items.length ?? 0} de{" "}
              {response?.totalItems ?? 0} casos
            </span>
            {response && response.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Página anterior"
                >
                  ‹
                </Button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (number) => (
                    <Button
                      key={number}
                      size="icon"
                      variant={page === number ? "default" : "outline"}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </Button>
                  ),
                )}
                <Button
                  size="icon"
                  variant="outline"
                  disabled={page === pageCount}
                  onClick={() =>
                    setPage((current) => Math.min(pageCount, current + 1))
                  }
                  aria-label="Página siguiente"
                >
                  ›
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
