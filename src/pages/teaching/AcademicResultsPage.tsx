import React from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Clock3, FileArchive, FileText, Search, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";

type ResultStatus = "Cargado" | "Corrección requerida" | "Disponible para el paciente";
type Result = {
  id: string;
  name: string;
  caseId: string;
  study: string;
  student: string;
  studentId: string;
  uploadedAt: string;
  updatedAt: string;
  version: number;
  status: ResultStatus;
  kind: "PDF" | "DICOM" | "ZIP";
  size: string;
};
type Filter = ResultStatus | "Todos";
type SortKey = "name" | "caseId" | "student" | "uploadedAt" | "version" | "status" | "updatedAt";

// Datos locales de presentación. Cada fila representa un resultado independiente.
const results: Result[] = [
  { id: "RES-001", name: "Informe radiológico tórax", caseId: "CAS-20260921-0042", study: "Radiografía de tórax", student: "Ana Ruiz", studentId: "EST-1187", uploadedAt: "2026-09-21T14:32:00", updatedAt: "2026-09-21T14:32:00", version: 1, status: "Cargado", kind: "PDF", size: "1.2 MB" },
  { id: "RES-002", name: "Segmentación pulmonar", caseId: "CAS-20260920-0038", study: "Tomografía de tórax", student: "Laura Gómez", studentId: "EST-1042", uploadedAt: "2026-09-20T10:15:00", updatedAt: "2026-09-21T09:10:00", version: 2, status: "Disponible para el paciente", kind: "DICOM", size: "8.4 MB" },
  { id: "RES-003", name: "Mediciones cardíacas", caseId: "CAS-20260919-0031", study: "Ecocardiograma", student: "Mateo Sánchez", studentId: "EST-1205", uploadedAt: "2026-09-19T16:40:00", updatedAt: "2026-09-20T11:20:00", version: 1, status: "Corrección requerida", kind: "PDF", size: "843 KB" },
  { id: "RES-004", name: "Reconstrucción 3D", caseId: "CAS-20260918-0027", study: "Tomografía abdominal", student: "Camila Vega", studentId: "EST-0998", uploadedAt: "2026-09-18T12:08:00", updatedAt: "2026-09-18T12:08:00", version: 1, status: "Cargado", kind: "ZIP", size: "12.6 MB" },
  { id: "RES-005", name: "Informe final", caseId: "CAS-20260917-0021", study: "Resonancia cerebral", student: "Daniel Ramírez", studentId: "EST-1076", uploadedAt: "2026-09-17T17:22:00", updatedAt: "2026-09-17T17:22:00", version: 3, status: "Disponible para el paciente", kind: "PDF", size: "1.1 MB" },
  { id: "RES-006", name: "Máscaras de segmentación", caseId: "CAS-20260916-0018", study: "Tomografía de rodilla", student: "Paula Torres", studentId: "EST-1033", uploadedAt: "2026-09-16T13:05:00", updatedAt: "2026-09-16T16:40:00", version: 1, status: "Corrección requerida", kind: "ZIP", size: "4.8 MB" },
  { id: "RES-007", name: "Informe preliminar", caseId: "CAS-20260915-0013", study: "Radiografía de mano", student: "Sofía Herrera", studentId: "EST-1101", uploadedAt: "2026-09-15T09:26:00", updatedAt: "2026-09-15T12:15:00", version: 1, status: "Disponible para el paciente", kind: "PDF", size: "567 KB" },
  { id: "RES-008", name: "Análisis de imágenes", caseId: "CAS-20260914-0009", study: "Tomografía de cráneo", student: "Juan Castillo", studentId: "EST-1250", uploadedAt: "2026-09-14T12:40:00", updatedAt: "2026-09-14T12:40:00", version: 2, status: "Cargado", kind: "PDF", size: "2.3 MB" },
  { id: "RES-009", name: "Informe de seguimiento", caseId: "CAS-20260921-0042", study: "Radiografía de tórax", student: "Ana Ruiz", studentId: "EST-1187", uploadedAt: "2026-09-13T08:45:00", updatedAt: "2026-09-13T08:45:00", version: 1, status: "Cargado", kind: "PDF", size: "916 KB" },
  { id: "RES-010", name: "Serie de contraste", caseId: "CAS-20260912-0008", study: "Tomografía abdominal", student: "Mariana León", studentId: "EST-1190", uploadedAt: "2026-09-12T15:10:00", updatedAt: "2026-09-13T09:30:00", version: 2, status: "Disponible para el paciente", kind: "DICOM", size: "6.2 MB" },
  { id: "RES-011", name: "Informe de lesiones", caseId: "CAS-20260911-0007", study: "Resonancia de rodilla", student: "Felipe Moreno", studentId: "EST-1021", uploadedAt: "2026-09-11T11:24:00", updatedAt: "2026-09-11T14:10:00", version: 1, status: "Corrección requerida", kind: "PDF", size: "1.6 MB" },
  { id: "RES-012", name: "Medición volumétrica", caseId: "CAS-20260910-0006", study: "Resonancia cerebral", student: "Valentina Díaz", studentId: "EST-1114", uploadedAt: "2026-09-10T09:14:00", updatedAt: "2026-09-10T09:14:00", version: 1, status: "Cargado", kind: "ZIP", size: "7.3 MB" },
  { id: "RES-013", name: "Resumen de hallazgos", caseId: "CAS-20260909-0005", study: "Radiografía de tórax", student: "Andrés Castro", studentId: "EST-1128", uploadedAt: "2026-09-09T14:30:00", updatedAt: "2026-09-10T10:05:00", version: 2, status: "Disponible para el paciente", kind: "PDF", size: "731 KB" },
  { id: "RES-014", name: "Anotaciones pulmonares", caseId: "CAS-20260920-0038", study: "Tomografía de tórax", student: "Laura Gómez", studentId: "EST-1042", uploadedAt: "2026-09-08T10:22:00", updatedAt: "2026-09-08T10:22:00", version: 1, status: "Cargado", kind: "ZIP", size: "5.1 MB" },
  { id: "RES-015", name: "Informe de control", caseId: "CAS-20260907-0004", study: "Ecocardiograma", student: "Sara Rojas", studentId: "EST-1136", uploadedAt: "2026-09-07T13:20:00", updatedAt: "2026-09-07T16:45:00", version: 1, status: "Corrección requerida", kind: "PDF", size: "985 KB" },
  { id: "RES-016", name: "Imágenes procesadas", caseId: "CAS-20260906-0003", study: "Tomografía de cráneo", student: "Nicolás Molina", studentId: "EST-1144", uploadedAt: "2026-09-06T08:12:00", updatedAt: "2026-09-06T08:12:00", version: 1, status: "Cargado", kind: "DICOM", size: "9.8 MB" },
  { id: "RES-017", name: "Informe diagnóstico", caseId: "CAS-20260905-0002", study: "Radiografía de mano", student: "Elena Navarro", studentId: "EST-1152", uploadedAt: "2026-09-05T16:32:00", updatedAt: "2026-09-06T09:10:00", version: 2, status: "Disponible para el paciente", kind: "PDF", size: "1.4 MB" },
  { id: "RES-018", name: "Segmentación revisada", caseId: "CAS-20260904-0001", study: "Tomografía abdominal", student: "Tomás Salazar", studentId: "EST-1160", uploadedAt: "2026-09-04T11:08:00", updatedAt: "2026-09-04T11:08:00", version: 2, status: "Cargado", kind: "ZIP", size: "4.9 MB" },
  { id: "RES-019", name: "Informe comparativo", caseId: "CAS-20260903-0022", study: "Resonancia cerebral", student: "Isabel Méndez", studentId: "EST-1168", uploadedAt: "2026-09-03T09:45:00", updatedAt: "2026-09-03T12:00:00", version: 1, status: "Disponible para el paciente", kind: "PDF", size: "1.8 MB" },
  { id: "RES-020", name: "Mediciones de control", caseId: "CAS-20260902-0020", study: "Ecocardiograma", student: "Óscar Pardo", studentId: "EST-1176", uploadedAt: "2026-09-02T14:55:00", updatedAt: "2026-09-02T14:55:00", version: 1, status: "Cargado", kind: "PDF", size: "692 KB" },
  { id: "RES-021", name: "Corrección de informe", caseId: "CAS-20260901-0019", study: "Radiografía de tórax", student: "Ana Ruiz", studentId: "EST-1187", uploadedAt: "2026-09-01T10:20:00", updatedAt: "2026-09-01T12:35:00", version: 2, status: "Corrección requerida", kind: "PDF", size: "1.3 MB" },
  { id: "RES-022", name: "Serie de seguimiento", caseId: "CAS-20260831-0017", study: "Resonancia de rodilla", student: "Camila Vega", studentId: "EST-0998", uploadedAt: "2026-08-31T08:40:00", updatedAt: "2026-09-01T09:05:00", version: 1, status: "Disponible para el paciente", kind: "DICOM", size: "7.6 MB" },
  { id: "RES-023", name: "Informe complementario", caseId: "CAS-20260830-0016", study: "Tomografía de tórax", student: "Paula Torres", studentId: "EST-1033", uploadedAt: "2026-08-30T15:28:00", updatedAt: "2026-08-30T15:28:00", version: 1, status: "Cargado", kind: "PDF", size: "824 KB" },
  { id: "RES-024", name: "Reconstrucción final", caseId: "CAS-20260829-0015", study: "Tomografía de cráneo", student: "Juan Castillo", studentId: "EST-1250", uploadedAt: "2026-08-29T11:36:00", updatedAt: "2026-08-30T08:50:00", version: 3, status: "Disponible para el paciente", kind: "ZIP", size: "11.2 MB" },
];

const pageSize = 8;
const filters: Filter[] = ["Todos", "Cargado", "Corrección requerida", "Disponible para el paciente"];
const statusConfig: Record<ResultStatus, { variant: "info" | "warning" | "success"; icon: typeof FileText }> = {
  Cargado: { variant: "info", icon: Clock3 },
  "Corrección requerida": { variant: "warning", icon: TriangleAlert },
  "Disponible para el paciente": { variant: "success", icon: CheckCircle2 },
};
const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", {
  day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
}).format(new Date(value));

export function AcademicResultsPage() {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("Todos");
  const [sort, setSort] = React.useState<{ key: SortKey; ascending: boolean }>({ key: "uploadedAt", ascending: false });
  const [page, setPage] = React.useState(1);
  const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
  const counts = Object.fromEntries(filters.map((item) => [item, item === "Todos" ? results.length : results.filter((result) => result.status === item).length])) as Record<Filter, number>;
  const filtered = results.filter((result) =>
    (filter === "Todos" || result.status === filter) &&
    `${result.id} ${result.name} ${result.caseId} ${result.student} ${result.studentId}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")),
  );
  const ordered = [...filtered].sort((a, b) => {
    const result = sort.key === "version" ? a.version - b.version
      : sort.key === "uploadedAt" || sort.key === "updatedAt" ? String(a[sort.key]).localeCompare(String(b[sort.key]))
      : collator.compare(String(a[sort.key]), String(b[sort.key]));
    return sort.ascending ? result : -result;
  });
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const visible = ordered.slice((page - 1) * pageSize, page * pageSize);
  const changeSort = (key: SortKey) => { setSort((current) => ({ key, ascending: current.key === key ? !current.ascending : true })); setPage(1); };
  const sortHeader = (label: string, key: SortKey) => (
    <button type="button" onClick={() => changeSort(key)} className="inline-flex items-center gap-1 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Ordenar por ${label}`}>
      {label}{sort.key === key ? (sort.ascending ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />) : <ArrowDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />}
    </button>
  );

  return <div className="space-y-4">
    <Card><CardContent className="flex gap-5 p-5 sm:p-6">
      <div className="w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <div className="min-w-0"><h1 className="text-2xl font-semibold text-content">Resultados de docencia</h1><p className="mt-1 text-sm leading-5 text-muted">Consulta los resultados subidos por los estudiantes en los casos académicos.</p></div>
    </CardContent></Card>

    <Card><CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
      <label className="relative block w-full xl:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar por resultado, caso o estudiante" aria-label="Buscar por identificador de resultado, caso o estudiante" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary/30" />
      </label>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 xl:pb-0" aria-label="Filtrar por estado">
        {filters.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => { setFilter(item); setPage(1); }} aria-pressed={filter === item} className={cn("shrink-0 rounded-full", filter !== item && item === "Cargado" && "border-info/20 bg-info/10 text-info", filter !== item && item === "Corrección requerida" && "border-warning/20 bg-warning/10 text-warning", filter !== item && item === "Disponible para el paciente" && "border-success/20 bg-success/10 text-success")}>{item} ({counts[item]})</Button>)}
      </div>
      <label className="sr-only" htmlFor="academic-results-order">Orden de resultados</label>
      <select id="academic-results-order" value={sort.key === "uploadedAt" && !sort.ascending ? "newest" : sort.key === "uploadedAt" ? "oldest" : sort.key === "name" && sort.ascending ? "name" : "custom"} onChange={(event) => { setSort(event.target.value === "oldest" ? { key: "uploadedAt", ascending: true } : event.target.value === "name" ? { key: "name", ascending: true } : { key: "uploadedAt", ascending: false }); setPage(1); }} className="h-9 shrink-0 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><option value="custom" disabled>Orden por columna</option><option value="newest">Más reciente</option><option value="oldest">Más antiguo</option><option value="name">Resultado A–Z</option></select>
    </CardContent></Card>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-muted dark:bg-slate-800"><tr>
            <th scope="col" className="px-4 py-3">{sortHeader("Resultado", "name")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Caso", "caseId")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Estudiante responsable", "student")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Fecha de carga", "uploadedAt")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Versión", "version")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Estado", "status")}</th>
            <th scope="col" className="px-4 py-3">{sortHeader("Última actualización", "updatedAt")}</th>
            <th scope="col" className="px-4 py-3">Acciones</th>
          </tr></thead>
          <tbody>{visible.map((item) => {
            const StatusIcon = statusConfig[item.status].icon;
            const FileIcon = item.kind === "ZIP" ? FileArchive : FileText;
            return <tr key={item.id} className="border-t border-slate-100 text-content hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-800/60">
              <td className="px-4 py-2.5"><span className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-slate-50 text-primary dark:bg-slate-800"><FileIcon className="h-4 w-4" aria-hidden="true" /></span><span className="min-w-0"><span className="block whitespace-nowrap text-sm font-medium">{item.name}</span><span className="block text-xs text-muted">{item.kind} · {item.size} · {item.id}</span></span></span></td>
              <td className="px-4 py-2.5"><span className="block whitespace-nowrap font-medium">{item.caseId}</span><span className="block whitespace-nowrap text-muted">{item.study}</span></td>
              <td className="px-4 py-2.5"><span className="block whitespace-nowrap font-medium">{item.student}</span><span className="block text-muted">{item.studentId}</span></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(item.uploadedAt)}</td>
              <td className="px-4 py-2.5 text-muted">v{item.version}</td>
              <td className="px-4 py-2.5"><Badge variant={statusConfig[item.status].variant} className="gap-1.5 whitespace-nowrap"><StatusIcon className="h-4 w-4" aria-hidden="true" />{item.status}</Badge></td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(item.updatedAt)}</td>
              <td className="px-4 py-2.5"><Link to={`/casos-academicos/${item.caseId}`} className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-content hover:border-primary/30 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><FileText className="h-4 w-4 text-primary" aria-hidden="true" />Ver caso</Link></td>
            </tr>;
          })}{visible.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">No hay resultados que coincidan con la búsqueda y el estado seleccionados.</td></tr>}</tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Mostrando {visible.length} de {ordered.length} resultados</span>
        <nav aria-label="Paginación de resultados" className="flex items-center gap-1">
          <Button size="icon" variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <Button key={number} size="icon" variant={page === number ? "default" : "outline"} onClick={() => setPage(number)} aria-label={`Página ${number}`} aria-current={page === number ? "page" : undefined}>{number}</Button>)}
          <Button size="icon" variant="outline" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Página siguiente"><ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
        </nav>
      </div>
    </Card>
  </div>;
}
