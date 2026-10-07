import React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock3,
  FileArchive,
  FileText,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { getResearcherResults } from "../../services/researcherResults";
import type {
  ResearcherResultItem,
  ResearcherResultSortField,
  ResearcherResultStatus,
  ResearcherResultsResponse,
} from "../../types/researcherResults";

type ResultFilter = "ALL" | ResearcherResultStatus;

const statusLabels: Record<ResearcherResultStatus, string> = {
  UPLOADED: "Cargado",
  AVAILABLE: "Disponible para el paciente",
  CORRECTION_REQUIRED: "Corrección requerida",
  DELETED: "Eliminado",
};

const statusStyles: Record<ResearcherResultStatus, { variant: "info" | "warning" | "success" | "destructive"; icon: typeof FileText }> = {
  UPLOADED: { variant: "info", icon: Clock3 },
  AVAILABLE: { variant: "success", icon: CheckCircle2 },
  CORRECTION_REQUIRED: { variant: "warning", icon: TriangleAlert },
  DELETED: { variant: "destructive", icon: TriangleAlert },
};

const filters: ResultFilter[] = ["ALL", "UPLOADED", "CORRECTION_REQUIRED", "AVAILABLE", "DELETED"];
const pageSize = 8;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
}

function formatSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function getSortValue(item: ResearcherResultItem, key: ResearcherResultSortField): string {
  switch (key) {
    case "originalFilename": return item.originalFilename;
    case "referenceCode": return item.case.referenceCode;
    case "uploadedAt": return item.uploadedAt;
    case "status": return item.status;
    case "updatedAt": return item.updatedAt;
  }
}

export function ResearcherResultsPage() {
  const [response, setResponse] = React.useState<ResearcherResultsResponse | null>(null);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ResultFilter>("ALL");
  const [sort, setSort] = React.useState<{ key: ResearcherResultSortField; ascending: boolean }>({ key: "uploadedAt", ascending: false });
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    getResearcherResults()
      .then((data) => { if (active) setResponse(data); })
      .catch(() => { if (active) setError("No se pudieron cargar los resultados."); });
    return () => { active = false; };
  }, []);

  const items = response?.items ?? [];
  const counts: Record<ResultFilter, number> = {
    ALL: response?.summary.total ?? 0,
    UPLOADED: response?.summary.uploaded ?? 0,
    AVAILABLE: response?.summary.available ?? 0,
    CORRECTION_REQUIRED: response?.summary.correctionRequired ?? 0,
    DELETED: response?.summary.deleted ?? 0,
  };
  const normalizedQuery = normalize(query.trim());
  const filtered = items.filter((item) =>
    (filter === "ALL" || item.status === filter) &&
    normalize(`${item.originalFilename} ${item.case.referenceCode} ${item.case.studyName}`).includes(normalizedQuery),
  );
  const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const ordered = [...filtered].sort((a, b) => {
    const comparison = collator.compare(getSortValue(a, sort.key), getSortValue(b, sort.key));
    return sort.ascending ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key: ResearcherResultSortField) => {
    setSort((current) => ({ key, ascending: current.key === key ? !current.ascending : true }));
    setPage(1);
  };
  const sortHeader = (label: string, key: ResearcherResultSortField) => (
    <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por ${label}`}>
      {label}{sort.key === key ? sort.ascending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />}
    </button>
  );

  return <div className="space-y-4">
    <Card><CardContent className="flex gap-5 p-5 sm:p-6">
      <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <div className="min-w-0"><h1 className="text-2xl font-semibold text-content">Resultados cargados</h1><p className="mt-1 text-sm leading-5 text-muted">Consulta los resultados asociados a tus casos asignados.</p></div>
    </CardContent></Card>

    <Card><CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
      <label className="relative block w-full xl:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por resultado, caso o estudio" aria-label="Buscar por resultado, caso o estudio" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
      </label>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Filtrar por estado">
        {filters.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => { setFilter(item); setPage(1); }} aria-pressed={filter === item} className={cn("shrink-0 rounded-full", filter !== item && item === "UPLOADED" && "border-info/20 bg-info/10 text-info", filter !== item && item === "CORRECTION_REQUIRED" && "border-warning/20 bg-warning/10 text-warning", filter !== item && item === "AVAILABLE" && "border-success/20 bg-success/10 text-success", filter !== item && item === "DELETED" && "border-danger/20 bg-danger/10 text-danger")}>{item === "ALL" ? "Todos" : statusLabels[item]} ({counts[item]})</Button>)}
      </div>
      <label className="sr-only" htmlFor="researcher-results-order">Orden de resultados</label>
      <select id="researcher-results-order" value={sort.key === "uploadedAt" && !sort.ascending ? "newest" : sort.key === "uploadedAt" ? "oldest" : sort.key === "originalFilename" && sort.ascending ? "name" : "custom"} onChange={(event) => { setSort(event.target.value === "oldest" ? { key: "uploadedAt", ascending: true } : event.target.value === "name" ? { key: "originalFilename", ascending: true } : { key: "uploadedAt", ascending: false }); setPage(1); }} className="h-9 shrink-0 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><option value="custom" disabled>Orden por columna</option><option value="newest">Más reciente</option><option value="oldest">Más antiguo</option><option value="name">Resultado A–Z</option></select>
    </CardContent></Card>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-muted dark:bg-slate-800"><tr>
            <th scope="col" className="px-4 py-3">{sortHeader("Resultado", "originalFilename")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Caso", "referenceCode")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Fecha de carga", "uploadedAt")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Estado", "status")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Última actualización", "updatedAt")}</th>
            <th scope="col" className="px-4 py-3">Acciones</th>
          </tr></thead>
          <tbody>{visible.map((item) => {
            const config = statusStyles[item.status];
            const StatusIcon = config.icon;
            const FileIcon = item.contentType === "application/zip" ? FileArchive : FileText;
            return <tr key={item.id} className="border-t border-slate-100 text-content hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
              <td className="px-4 py-2.5"><span className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-slate-50 text-primary dark:bg-slate-800"><FileIcon className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0"><span className="block whitespace-nowrap text-sm font-medium">{item.originalFilename}</span><span className="block text-xs text-muted">{item.contentType} · {formatSize(item.sizeBytes)} · {item.id}</span></span></span></td>
              <td className="px-4 py-2.5"><span className="block whitespace-nowrap font-medium">{item.case.referenceCode}</span><span className="block whitespace-nowrap text-muted">{item.case.studyName}</span></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(item.uploadedAt)}</td>
              <td className="px-4 py-2.5"><Badge variant={config.variant} className="gap-1.5 whitespace-nowrap"><StatusIcon className="h-4 w-4" aria-hidden="true" />{statusLabels[item.status]}</Badge>{item.status === "DELETED" && <span className="mt-1 block max-w-48 text-[11px] leading-4 text-muted" title={item.deletionReason ?? undefined}>{item.deletedAt ? `Eliminado ${formatDate(item.deletedAt)}` : ""}{item.deletionReason ? ` · ${item.deletionReason}` : ""}</span>}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(item.updatedAt)}</td>
              <td className="px-4 py-2.5"><Link to={`/casos_academicos/${item.case.referenceCode}`} className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-content hover:border-primary/30 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><FileText className="h-4 w-4 text-primary" aria-hidden="true" />Ver caso</Link></td>
            </tr>;
          })}{response && visible.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No hay resultados que coincidan con la búsqueda y el estado seleccionados.</td></tr>}</tbody>
        </table>
      </div>
      {!response && !error && <p role="status" className="px-4 py-3 text-sm text-muted">Cargando resultados…</p>}
      {error && <p role="alert" className="px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Mostrando {visible.length} de {ordered.length} resultados</span>
        <nav aria-label="Paginación de resultados" className="flex items-center gap-1">
          <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={page === number ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={page === number ? "page" : undefined}>{number}</Button>)}
          <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
        </nav>
      </div>
    </Card>
  </div>;
}
