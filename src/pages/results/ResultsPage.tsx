import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Info,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { getPatientResults } from "../../services/patientResults";
import type { PatientResultPublicationType, PatientResultsResponse } from "../../types/patientResults";

const publicationTypeLabels: Record<PatientResultPublicationType, string> = {
  INITIAL: "Publicado",
  CORRECTED: "Corregido",
};

const formatContentType = (contentType: string) =>
  contentType === "application/pdf" ? "PDF" : contentType;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));

const SummaryItem = ({
  icon: Icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: typeof FileText;
  value: string;
  label: string;
  detail?: string;
  tone: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 p-3 dark:border-slate-700 dark:bg-slate-800/40">
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-full",
        tone,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
    <span>
      <strong className="block text-lg leading-5 text-slate-900 dark:text-slate-100">
        {value}
      </strong>
      <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {detail && (
        <span className="block text-xs text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      )}
    </span>
  </div>
);

export const ResultsPage: React.FC = () => {
  const [downloadFeedback, setDownloadFeedback] = React.useState("");
  const [filter, setFilter] = React.useState<"Todos" | "Publicados" | "Corregidos">("Todos");
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [ascending, setAscending] = React.useState(false);
  const [response, setResponse] = React.useState<PatientResultsResponse | null>(null);
  const [error, setError] = React.useState("");
  const filterByPublicationType: Record<Exclude<typeof filter, "Todos">, PatientResultPublicationType> = {
    Publicados: "INITIAL",
    Corregidos: "CORRECTED",
  };
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);
  React.useEffect(() => {
    let active = true;
    setResponse(null);
    setError("");
    if (query !== debouncedQuery) return () => { active = false; };
    getPatientResults({ q: debouncedQuery, sort: ascending ? "availableAt,asc" : "availableAt,desc" })
      .then((data) => { if (active) setResponse(data); })
      .catch(() => { if (active) setError("No se pudieron cargar los resultados."); });
    return () => { active = false; };
  }, [query, debouncedQuery, ascending]);
  const items = response?.items ?? [];
  const visible = filter === "Todos"
    ? items
    : items.filter((item) => item.publicationType === filterByPublicationType[filter]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative z-10 max-w-xl border-l-4 border-indigo-600 pl-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Resultados
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
            Resultados
          </h1>
          <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            Consulta los archivos publicados para tus estudios y accede al caso
            para descargarlos.
          </p>
        </div>
        <div className="pointer-events-none absolute right-12 top-5 hidden items-center gap-3 text-indigo-100 dark:text-indigo-950 md:flex">
          <FileText className="h-24 w-24 -rotate-6" />
          <FileImage className="h-16 w-16 rotate-6 text-blue-100 dark:text-blue-950" />
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por caso, estudio o nombre de archivo..."
              aria-label="Buscar resultados"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["Todos", "Publicados", "Corregidos"] as const).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={filter === item ? "outline" : "secondary"}
                onClick={() => setFilter(item)}
                className={cn(
                  filter === item &&
                    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
                )}
              >
                {item}{" "}
                <span className="ml-1 text-xs opacity-70">
                  {item === "Todos"
                    ? response?.totalItems ?? 0
                    : items.filter((r) => r.publicationType === filterByPublicationType[item]).length}
                </span>
              </Button>
            ))}
          </div>
          <Button variant="outline" onClick={() => setAscending((value) => !value)} className="justify-start lg:w-44">
            <Calendar className="h-4 w-4" />
            {ascending ? "Más antiguos" : "Más recientes"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-indigo-600" />
              Resultados disponibles ({visible.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Identificador del caso</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Estudio</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Nombre del archivo</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Tipo</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Fecha disponible</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Tipo de publicación</th>
                    <th scope="col" className="whitespace-nowrap px-3 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.resultId} className="border-t border-slate-100 text-slate-700 transition-colors hover:bg-slate-50/70 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{item.caseReferenceCode}</td>
                      <td className="px-3 py-3">
                        <span className="whitespace-nowrap font-medium">{item.studyName}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-700 dark:text-slate-200">{item.fileName}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">{formatContentType(item.contentType)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-500 dark:text-slate-400">{formatDate(item.availableAt)}</td>
                      <td className="px-3 py-3">
                        <Badge variant="neutral" className={cn(
                          "whitespace-nowrap border-0",
                          item.publicationType === "INITIAL"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-200",
                        )}>{publicationTypeLabels[item.publicationType]}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                            onClick={() => setDownloadFeedback(`No hay un archivo descargable asociado a ${item.fileName} en estos datos de demostración.`)}
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />Descargar
                          </Button>
                          <Link to={`/mis_casos/${item.caseReferenceCode}`} className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-indigo-300">
                            <FileText className="h-4 w-4" aria-hidden="true" />Ver caso
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {response && visible.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No hay resultados que coincidan con la búsqueda y los filtros seleccionados.</td></tr>}
                </tbody>
              </table>
            </div>
            {!response && !error && <p role="status" className="mt-3 text-sm text-slate-500">Cargando resultados…</p>}
            {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            {downloadFeedback && <p role="status" className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-strong">{downloadFeedback}</p>}
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SummaryItem
                icon={FileText}
                value={String(response?.summary.availableCaseCount ?? 0)}
                label="Casos con resultados"
                detail="Con archivos disponibles"
                tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              />
              <SummaryItem
                icon={Calendar}
                value={response?.summary.latestPublishedAt ? formatDate(response.summary.latestPublishedAt) : "—"}
                label="Última publicación"
                tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-amber-500 dark:text-amber-300" />
                Ten en cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <p className="flex gap-3">
                <FileText className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                Cada caso muestra su archivo de resultado vigente.
              </p>
              <p className="flex gap-3">
                <Download className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                Puedes descargar los resultados disponibles desde el caso.
              </p>
              <p className="flex gap-3">
                <TriangleAlert className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                Algunos resultados pueden descargarse según las políticas
                institucionales.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};
