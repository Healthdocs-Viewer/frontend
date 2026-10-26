import React from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Eye,
  FileArchive,
  FileText,
  Search,
  Send,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { getCoordinatorResults } from "../../services/coordinatorResults";
import { apiClient } from "../../services/apiClient";
import type {
  CoordinatorResultItem,
  CoordinatorResultSortField,
  CoordinatorResultStatus,
  CoordinatorResultsResponse,
} from "../../types/coordinatorResults";

type ResultFilter = "ALL" | CoordinatorResultStatus;

const statusLabels: Record<CoordinatorResultStatus, string> = {
  UPLOADED: "Cargado",
  CORRECTION_REQUIRED: "Corrección requerida",
  AVAILABLE: "Disponible para el paciente",
};

const statusStyles: Record<CoordinatorResultStatus, { variant: "info" | "warning" | "success" | "destructive"; icon: typeof FileText }> = {
  UPLOADED: { variant: "info", icon: Clock3 },
  CORRECTION_REQUIRED: { variant: "warning", icon: TriangleAlert },
  AVAILABLE: { variant: "success", icon: CheckCircle2 },
};

const filters: ResultFilter[] = ["ALL", "UPLOADED", "CORRECTION_REQUIRED", "AVAILABLE"];
const filterLabels: Record<ResultFilter, string> = { ALL: "Todos", ...statusLabels };
const pageSize = 8;

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("es-CO", {
  day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value)) : "—";

const formatSize = (sizeBytes: number | null) => {
  if (sizeBytes === null) return "Tamaño no disponible";
  if (sizeBytes >= 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
};

function getSortValue(item: CoordinatorResultItem, key: CoordinatorResultSortField): string | number {
  switch (key) {
    case "originalFilename": return item.file.originalFilename;
    case "referenceCode": return item.case.referenceCode;
    case "researcherName": return item.uploadedBy?.fullName ?? "";
    case "uploadedAt": return item.uploadedAt ?? "";
    case "version": return item.version;
    case "status": return item.status;
    case "updatedAt": return item.updatedAt ?? "";
  }
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function getErrorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (cause && typeof cause === "object" && "message" in cause && typeof cause.message === "string") {
    return cause.message;
  }
  return "No se pudo publicar el resultado. Inténtalo de nuevo.";
}

export function CoordinatorResultsPage() {
  const [response, setResponse] = React.useState<CoordinatorResultsResponse | null>(null);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ResultFilter>("UPLOADED");
  const [sort, setSort] = React.useState<{ key: CoordinatorResultSortField; ascending: boolean }>({ key: "uploadedAt", ascending: false });
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState("");
  const [resultToPublish, setResultToPublish] = React.useState<CoordinatorResultItem | null>(null);
  const [publishingId, setPublishingId] = React.useState("");
  const publishingLock = React.useRef(false);
  const [publishError, setPublishError] = React.useState("");
  const [publishMessage, setPublishMessage] = React.useState("");
  const [resultToCorrect, setResultToCorrect] = React.useState<CoordinatorResultItem | null>(null);
  const [correctionReason, setCorrectionReason] = React.useState("");
  const [correctionLoading, setCorrectionLoading] = React.useState(false);
  const [correctionError, setCorrectionError] = React.useState("");
  const [fileActionLoadingId, setFileActionLoadingId] = React.useState("");
  const [fileActionError, setFileActionError] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState("");

  const previewResult = async (item: CoordinatorResultItem) => {
    if (fileActionLoadingId) return;
    const previewWindow = window.open("about:blank", "_blank");
    setFileActionLoadingId(item.id);
    setFileActionError("");
    setPreviewUrl("");
    try {
      const intent = await apiClient.internal.createResultDownload(item.case.id, item.id);
      if (previewWindow) {
        previewWindow.location.replace(intent.downloadUrl);
        previewWindow.opener = null;
      } else {
        setPreviewUrl(intent.downloadUrl);
      }
    } catch (cause) {
      previewWindow?.close();
      setFileActionError(getErrorMessage(cause));
    } finally {
      setFileActionLoadingId("");
    }
  };

  const publishResult = async () => {
    if (!resultToPublish || publishingLock.current) return;
    const selected = resultToPublish;
    publishingLock.current = true;
    setPublishingId(selected.id);
    setPublishError("");
    setPublishMessage("");
    try {
      await apiClient.operations.publishAcademicCaseResult(selected.id);
      setResponse((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === selected.id
          ? { ...item, status: "AVAILABLE", publicationType: item.publicationType ?? (item.version === 1 ? "INITIAL" : "CORRECTED"), availableAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : item),
        summary: {
          ...current.summary,
          uploaded: Math.max(0, current.summary.uploaded - 1),
          available: current.summary.available + 1,
        },
      } : current);
      setPublishMessage(`El resultado ${selected.file.originalFilename} quedó disponible para el paciente.`);
      setResultToPublish(null);
    } catch (cause) {
      setPublishError(getErrorMessage(cause));
    } finally {
      publishingLock.current = false;
      setPublishingId("");
    }
  };

  const requestCorrection = async () => {
    if (!resultToCorrect || !correctionReason.trim() || correctionLoading) return;
    const selected = resultToCorrect;
    setCorrectionLoading(true);
    setCorrectionError("");
    try {
      await apiClient.operations.requestAcademicResultCorrection(selected.id, correctionReason.trim());
      const now = new Date().toISOString();
      setResponse((current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === selected.id
          ? { ...item, status: "CORRECTION_REQUIRED", correctionRequest: correctionReason.trim(), updatedAt: now }
          : item),
        summary: {
          ...current.summary,
          uploaded: Math.max(0, current.summary.uploaded - (selected.status === "UPLOADED" ? 1 : 0)),
          available: Math.max(0, current.summary.available - (selected.status === "AVAILABLE" ? 1 : 0)),
          correctionRequired: current.summary.correctionRequired + 1,
        },
      } : current);
      setPublishMessage(`El resultado ${selected.file.originalFilename} fue devuelto para corrección.`);
      setResultToCorrect(null);
      setCorrectionReason("");
    } catch (cause) {
      setCorrectionError(getErrorMessage(cause));
    } finally {
      setCorrectionLoading(false);
    }
  };

  React.useEffect(() => {
    let active = true;
    getCoordinatorResults()
      .then((data) => { if (active) setResponse(data); })
      .catch(() => { if (active) setError("No se pudieron cargar los resultados."); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const items = response?.items ?? [];
  const counts: Record<ResultFilter, number> = {
    ALL: response?.summary.total ?? 0,
    UPLOADED: response?.summary.uploaded ?? 0,
    CORRECTION_REQUIRED: response?.summary.correctionRequired ?? 0,
    AVAILABLE: response?.summary.available ?? 0,
  };
  const normalizedQuery = normalize(debouncedQuery.trim());
  const filtered = items.filter((item) =>
    (filter === "ALL" || item.status === filter) &&
    normalize(`${item.file.originalFilename} ${item.case.referenceCode} ${item.uploadedBy?.fullName ?? ""} ${item.uploadedBy?.studentCode ?? ""}`).includes(normalizedQuery),
  );
  const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const ordered = [...filtered].sort((a, b) => {
    const statusPriority: Record<CoordinatorResultStatus, number> = {
      UPLOADED: 0,
      CORRECTION_REQUIRED: 1,
      AVAILABLE: 2,
    };
    const priorityDifference = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDifference !== 0) return priorityDifference;

    const left = getSortValue(a, sort.key);
    const right = getSortValue(b, sort.key);
    const comparison = typeof left === "number" && typeof right === "number"
      ? left - right
      : collator.compare(String(left), String(right));
    return sort.ascending ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key: CoordinatorResultSortField) => {
    setSort((current) => ({ key, ascending: current.key === key ? !current.ascending : true }));
    setPage(1);
  };
  const sortHeader = (label: string, key: CoordinatorResultSortField) => (
    <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por ${label}`}>
      {label}{sort.key === key ? sort.ascending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />}
    </button>
  );

  return <div className="space-y-4">
    <Card><CardContent className="flex gap-5 p-5 sm:p-6">
      <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <div className="min-w-0"><h1 className="text-2xl font-semibold text-content">Revisión de resultados</h1><p className="mt-1 text-sm leading-5 text-muted">Abre los resultados pendientes, publícalos para el paciente o devuélvelos al investigador con un motivo de corrección.</p></div>
    </CardContent></Card>

    {publishMessage && <p role="status" className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{publishMessage}</p>}
    {publishError && <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{publishError}</p>}
    {fileActionError && <p role="alert" className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{fileActionError}</p>}
    {previewUrl && <p role="status" className="rounded-lg border border-info/20 bg-info/10 px-4 py-3 text-sm text-content">El navegador bloqueó la pestaña nueva. <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">Abrir resultado</a></p>}

    <Card><CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
      <label className="relative block w-full xl:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por resultado, caso o investigador" aria-label="Buscar por resultado, caso o investigador" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
      </label>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Filtrar por estado">
        {filters.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => { setFilter(item); setPage(1); }} aria-pressed={filter === item} className={cn("shrink-0 rounded-full", filter !== item && item === "UPLOADED" && "border-info/20 bg-info/10 text-info", filter !== item && item === "CORRECTION_REQUIRED" && "border-warning/20 bg-warning/10 text-warning", filter !== item && item === "AVAILABLE" && "border-success/20 bg-success/10 text-success")}>{filterLabels[item]} ({counts[item]})</Button>)}
      </div>
      <label className="sr-only" htmlFor="academic-results-order">Orden de resultados</label>
      <select id="academic-results-order" value={sort.key === "uploadedAt" && !sort.ascending ? "newest" : sort.key === "uploadedAt" ? "oldest" : sort.key === "originalFilename" && sort.ascending ? "name" : "custom"} onChange={(event) => { setSort(event.target.value === "oldest" ? { key: "uploadedAt", ascending: true } : event.target.value === "name" ? { key: "originalFilename", ascending: true } : { key: "uploadedAt", ascending: false }); setPage(1); }} className="h-9 shrink-0 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><option value="custom" disabled>Orden por columna</option><option value="newest">Más reciente</option><option value="oldest">Más antiguo</option><option value="name">Resultado A–Z</option></select>
    </CardContent></Card>

    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-slate-50/70 px-4 py-3 text-xs font-semibold text-muted dark:bg-slate-800/70">
        <span className="mr-1">Ordenar:</span>
        {sortHeader("Resultado", "originalFilename")}
        {sortHeader("Caso", "referenceCode")}
        {sortHeader("Investigador", "researcherName")}
        {sortHeader("Fecha de carga", "uploadedAt")}
        {sortHeader("Versión", "version")}
        {sortHeader("Estado", "status")}
        {sortHeader("Actualización", "updatedAt")}
      </div>
      <div className="divide-y divide-border">{visible.map((item) => {
          const config = statusStyles[item.status];
          const StatusIcon = config.icon;
          const FileIcon = item.file.extension?.toLocaleLowerCase() === "zip" ? FileArchive : FileText;
          return <article key={item.id} className="min-w-0 p-4 text-content transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-slate-50 text-primary dark:bg-slate-800"><FileIcon className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2"><h2 className="min-w-0 break-all text-sm font-semibold sm:text-base">{item.file.originalFilename}</h2><Badge variant={config.variant} className="gap-1.5"><StatusIcon className="h-4 w-4" aria-hidden="true" />{statusLabels[item.status]}</Badge></div>
                <p className="mt-1 break-all text-xs text-muted">{formatSize(item.file.sizeBytes)} · {item.id}</p>
                <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3 lg:grid-cols-4">
                  <div className="min-w-0"><dt className="text-muted">Caso</dt><dd className="mt-0.5 break-words font-medium">{item.case.referenceCode}<span className="block font-normal text-muted">{item.case.studyName}</span></dd></div>
                  <div className="min-w-0"><dt className="text-muted">Investigador responsable</dt><dd className="mt-0.5 break-words font-medium">{item.uploadedBy?.fullName || "Investigador no disponible"}{item.uploadedBy?.studentCode && <span className="block font-normal text-muted">{item.uploadedBy.studentCode}</span>}</dd></div>
                  <div><dt className="text-muted">Fecha de carga</dt><dd className="mt-0.5 font-medium">{formatDate(item.uploadedAt)}</dd></div>
                  <div><dt className="text-muted">Versión · Actualización</dt><dd className="mt-0.5 font-medium">v{item.version} · {formatDate(item.updatedAt)}</dd></div>
                </dl>
                {item.status === "CORRECTION_REQUIRED" && item.correctionRequest && <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-5 text-muted"><strong className="text-content">Motivo de corrección: </strong>{item.correctionRequest}</p>}
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-3"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Acciones</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="h-9 gap-1.5 px-3 text-xs" disabled={Boolean(fileActionLoadingId)} onClick={() => void previewResult(item)}><Eye className="h-3.5 w-3.5" aria-hidden="true" />{fileActionLoadingId === item.id ? "Abriendo…" : "Ver resultado"}</Button><Link to={`/casos_academicos/${item.case.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-content hover:border-primary/30 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><FileText className="h-4 w-4 text-primary" aria-hidden="true" />Ver caso</Link>{item.status === "UPLOADED" && <><Button size="sm" className="h-9 gap-1.5 px-3 text-xs" onClick={() => { setPublishError(""); setResultToPublish(item); }}><Send className="h-3.5 w-3.5" aria-hidden="true" />Aceptar y publicar</Button><Button size="sm" variant="outline" className="h-9 border-warning/30 px-3 text-xs text-warning hover:bg-warning/10" onClick={() => { setCorrectionError(""); setCorrectionReason(""); setResultToCorrect(item); }}>Devolver para corrección</Button></>}{item.status === "AVAILABLE" && <Button size="sm" variant="outline" className="h-9 px-3 text-xs" onClick={() => { setCorrectionError(""); setCorrectionReason(""); setResultToCorrect(item); }}>Solicitar corrección</Button>}</div></div>
          </article>;
        })}{visible.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">No hay resultados que coincidan con la búsqueda y el estado seleccionados.</p>}</div>
      {!response && !error && <p role="status" className="px-4 py-3 text-sm text-muted">Cargando resultados…</p>}
      {error && <p role="alert" className="px-4 py-3 text-sm text-danger">{error}</p>}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Mostrando {visible.length} de {ordered.length} resultados</span>
        <nav aria-label="Paginación de resultados" className="flex items-center gap-1">
          <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={page === number ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={page === number ? "page" : undefined}>{number}</Button>)}
          <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
        </nav>
      </div>
    </Card>
    {resultToPublish && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !publishingId) setResultToPublish(null); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="publish-result-title" className="w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-xl">
        <h2 id="publish-result-title" className="text-lg font-semibold">Aceptar y publicar resultado</h2>
        <p className="mt-2 text-sm leading-5 text-muted">Vas a publicar <strong className="font-semibold text-content">{resultToPublish.file.originalFilename}</strong> para el caso {resultToPublish.case.referenceCode}. El paciente podrá consultarlo y descargarlo.</p>
        {publishError && <p role="alert" className="mt-3 text-sm text-danger">{publishError}</p>}
        <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={Boolean(publishingId)} onClick={() => setResultToPublish(null)}>Cancelar</Button><Button disabled={Boolean(publishingId)} onClick={() => void publishResult()}>{publishingId ? "Publicando…" : "Confirmar publicación"}</Button></footer>
      </section>
    </div>}
    {resultToCorrect && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !correctionLoading) setResultToCorrect(null); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="return-result-title" className="w-full max-w-md rounded-xl border border-border bg-surface p-5 text-content shadow-xl">
        <h2 id="return-result-title" className="text-lg font-semibold">{resultToCorrect.status === "UPLOADED" ? "Devolver resultado para corrección" : "Solicitar corrección del resultado"}</h2>
        <p className="mt-2 text-sm leading-5 text-muted">El investigador recibirá el motivo y podrá cargar una versión corregida. El paciente no verá este resultado.</p>
        <label htmlFor="result-correction-reason" className="mt-4 block text-sm font-medium">Motivo</label>
        <textarea id="result-correction-reason" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} rows={4} maxLength={4000} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content outline-none focus-visible:ring-2 focus-visible:ring-primary/30" placeholder="Indica qué debe corregirse…" />
        {correctionError && <p role="alert" className="mt-3 text-sm text-danger">{correctionError}</p>}
        <footer className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={correctionLoading} onClick={() => setResultToCorrect(null)}>Cancelar</Button><Button variant="destructive" disabled={correctionLoading || !correctionReason.trim()} onClick={() => void requestCorrection()}>{correctionLoading ? "Enviando…" : "Confirmar devolución"}</Button></footer>
      </section>
    </div>}
  </div>;
}
