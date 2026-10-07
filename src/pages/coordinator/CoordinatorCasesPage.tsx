import React from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, CircleDot,
  FileText, MoreVertical, Search, UserRoundPlus, Clock3,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { IconButton } from "../../components/ui/IconButton";
import { cn } from "../../components/ui/cn";
import { StudentAccessDrawer } from "../../components/cases/StudentAccessDrawer";
import { Link } from "react-router-dom";
import { getAcademicCases } from "../../services/academicCases";
import { getAcademicStudents, getStudentAssignmentsForCase, saveStudentAssignmentsForCase } from "../../services/academicStudents";
import type { AcademicCaseItem, AcademicCaseStatus } from "../../types/academicCases";
import type { AcademicStudent } from "../../types/academicStudents";

type AcademicStatusFilter = "Todos" | AcademicCaseStatus;

const statusLabels: Record<AcademicCaseStatus, string> = {
  ENABLED_FOR_PROCESSING: "En procesamiento",
  RESULT_UPLOADED: "Resultado cargado",
  RESULT_AVAILABLE: "Disponible para el paciente",
};

const statusConfig: Record<AcademicCaseStatus, { variant: "info" | "success"; icon: typeof CircleDot }> = {
  ENABLED_FOR_PROCESSING: { variant: "info", icon: Clock3 },
  RESULT_UPLOADED: { variant: "success", icon: CheckCircle2 },
  RESULT_AVAILABLE: { variant: "success", icon: FileText },
};

const filters: AcademicCaseStatus[] = [
  "ENABLED_FOR_PROCESSING",
  "RESULT_UPLOADED",
  "RESULT_AVAILABLE",
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export const CoordinatorCasesPage: React.FC = () => {
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<AcademicStatusFilter>("Todos");
  const [page, setPage] = React.useState(1);
  const [sortAscending, setSortAscending] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [activeCase, setActiveCase] = React.useState<AcademicCaseItem | null>(null);
  const [accessByCase, setAccessByCase] = React.useState<Record<string, string[]>>({});
  const [students, setStudents] = React.useState<AcademicStudent[]>([]);
  const [cases, setCases] = React.useState<AcademicCaseItem[] | null>(null);
  const [error, setError] = React.useState("");
  const pageSize = 8;
  React.useEffect(() => {
    let active = true;
    Promise.all([getAcademicCases(), getAcademicStudents()])
      .then(async ([items, studentResponse]) => {
        if (!active) return;
        setCases(items);
        setStudents(studentResponse.items);
        const assignmentResponses = await Promise.all(items.map((item) => getStudentAssignmentsForCase(item.id)));
        if (active) setAccessByCase(Object.fromEntries(assignmentResponses.map((assignment) => [assignment.caseId, assignment.studentIds])));
      })
      .catch(() => { if (active) setError("No se pudieron cargar los casos académicos."); });
    return () => { active = false; };
  }, []);
  const allCases = cases ?? [];
  const normalizedQuery = query.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const counts = Object.fromEntries([
    ["Todos", allCases.length],
    ...filters.map((status) => [status, allCases.filter((item) => item.status === status).length]),
  ]) as Record<string, number>;
  const filteredCases = allCases.filter((item) =>
    (activeFilter === "Todos" || item.status === activeFilter) &&
    `${item.referenceCode} ${item.studyName}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(normalizedQuery),
  ).sort((a, b) => sortAscending ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const pageCount = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const visibleCases = filteredCases.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (filter: AcademicStatusFilter) => { setActiveFilter(filter); setPage(1); };
  const openAccessDrawer = (item: AcademicCaseItem) => {
    setActiveCase(item);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <Card>
        <CardContent className="flex gap-4 p-5 sm:p-6">
          <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-content">Casos Académicos</h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted">
              Asigna investigadores a los casos habilitados y realiza el seguimiento del procesamiento hasta la disponibilidad del resultado.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Buscar por código o nombre del estudio"
                aria-label="Buscar por código o nombre del estudio"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:justify-end xl:overflow-visible xl:pb-0" aria-label="Filtrar por estado">
              <Button size="sm" variant={activeFilter === "Todos" ? "default" : "outline"} onClick={() => updateFilter("Todos")} aria-pressed={activeFilter === "Todos"} className="shrink-0 rounded-full">
                Todos ({counts.Todos})
              </Button>
              {filters.map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant="outline"
                  onClick={() => updateFilter(filter)}
                  aria-pressed={activeFilter === filter}
                  className={cn(
                    "shrink-0 rounded-full",
                    activeFilter === filter && "border-primary/30 bg-primary/10 text-primary-strong",
                    filter === "ENABLED_FOR_PROCESSING" && "border-info/20 bg-info/10 text-info",
                    filter === "RESULT_UPLOADED" && "border-success/20 bg-success/10 text-success",
                    filter === "RESULT_AVAILABLE" && "border-success/20 bg-success/10 text-success",
                  )}
                >
                  {statusLabels[filter]} ({counts[filter]})
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-muted dark:bg-slate-800">
                <tr>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Identificador del caso</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">
                    <button type="button" onClick={() => setSortAscending((value) => !value)} className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por fecha de recepción ${sortAscending ? "descendente" : "ascendente"}`}>
                      Fecha de recepción {sortAscending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Estado</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Investigador asignado</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Última actualización</th>
                  <th scope="col" className="whitespace-nowrap px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleCases.map((item) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.icon;
                  return (
                    <tr key={item.id} className="border-t border-slate-100 text-content transition-colors hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">{item.referenceCode}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={config.variant} className="whitespace-nowrap gap-1.5 px-3 py-1.5">
                          <StatusIcon className="h-4 w-4" aria-hidden="true" />{statusLabels[item.status]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">{accessByCase[item.id]?.map((userId) => students.find((student) => student.userId === userId)?.studentCode ?? userId).join(", ") || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">—</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openAccessDrawer(item)} className="whitespace-nowrap">
                            <UserRoundPlus className="h-4 w-4" aria-hidden="true" />
                            Gestionar acceso
                          </Button>
                          <Link to={`/casos_academicos/${item.referenceCode}`} className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted transition-colors hover:border-primary/30 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                            <FileText className="h-4 w-4" aria-hidden="true" />Ver detalle
                          </Link>
                          <IconButton icon={MoreVertical} label={`Más acciones para ${item.id}`} variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setFeedback(`Más acciones · ${item.id}`)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visibleCases.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No hay casos que coincidan con la búsqueda y el estado seleccionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!cases && !error && <p role="status" className="mt-3 text-sm text-muted">Cargando casos académicos…</p>}
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          {feedback && <p role="status" className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{feedback}</p>}
          <div className="flex flex-col gap-3 pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Mostrando {visibleCases.length} de {filteredCases.length} casos</span>
            <nav aria-label="Paginación de casos" className="flex items-center gap-1">
              <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <Button key={number} size="icon" variant={number === page ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={number === page ? "page" : undefined}>{number}</Button>
              ))}
              <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
            </nav>
          </div>
        </CardContent>
      </Card>
      <StudentAccessDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        caseId={activeCase?.referenceCode ?? ""}
        caseStatus={activeCase ? statusLabels[activeCase.status] : ""}
        caseUuid={activeCase?.id ?? ""}
        onSave={async (selectedIds, expectedVersion) => {
          if (!activeCase) return;
          const assignment = await saveStudentAssignmentsForCase(activeCase.id, { studentIds: selectedIds, expectedVersion });
          setAccessByCase((current) => ({ ...current, [activeCase.id]: assignment.studentIds }));
          setFeedback(`Acceso de investigadores actualizado para ${activeCase.referenceCode}.`);
        }}
      />
    </div>
  );
};
