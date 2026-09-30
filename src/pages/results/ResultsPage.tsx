import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  Info,
  Search,
  Stethoscope,
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

type Result = {
  id: string;
  study: string;
  clinic: string;
  date: string;
  images: number;
  status: "Nuevo" | "Consultado";
};
const results: Result[] = [
  {
    id: "CAS-20260910-0005",
    study: "TAC de abdomen",
    clinic: "Clínica Healthdocs",
    date: "10/9/2026, 11:32",
    images: 12,
    status: "Nuevo",
  },
  {
    id: "CAS-20260921-0002",
    study: "Radiografía de tórax",
    clinic: "Clínica Healthdocs",
    date: "20/9/2026, 20:45",
    images: 3,
    status: "Consultado",
  },
  {
    id: "CAS-20260918-0001",
    study: "Resonancia de rodilla",
    clinic: "Centro Médico del Sur",
    date: "18/9/2026, 16:20",
    images: 28,
    status: "Consultado",
  },
  {
    id: "CAS-20260905-0003",
    study: "Ecografía abdominal",
    clinic: "Clínica Healthdocs",
    date: "5/9/2026, 09:15",
    images: 15,
    status: "Consultado",
  },
];

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
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState<
    "Todos" | "Nuevos" | "Consultados"
  >("Todos");
  const [query, setQuery] = React.useState("");
  const visible = results.filter((item) => {
    const matchesFilter =
      filter === "Todos" || item.status === filter.slice(0, -1);
    return (
      matchesFilter &&
      `${item.id} ${item.study} ${item.clinic}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });

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
            Consulta, visualiza y descarga los resultados disponibles de tus
            estudios médicos.
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
              placeholder="Buscar por estudio, tipo de examen o ID de caso..."
              aria-label="Buscar resultados"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["Todos", "Nuevos", "Consultados"] as const).map((item) => (
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
                    ? results.length
                    : results.filter((r) => r.status === item.slice(0, -1))
                        .length}
                </span>
              </Button>
            ))}
          </div>
          <Button variant="outline" className="justify-start lg:w-44">
            <Calendar className="h-4 w-4" />
            Ordenar por fecha
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-indigo-600" />
              Resultados disponibles ({visible.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visible.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "grid gap-4 rounded-xl border p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_156px] sm:items-center",
                  item.status === "Nuevo"
                    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/40"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span
                    className={cn(
                      "grid h-14 w-14 shrink-0 place-items-center rounded-xl",
                      item.status === "Nuevo"
                        ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-500 dark:bg-blue-950/60 dark:text-blue-300",
                    )}
                  >
                    <Stethoscope className="h-7 w-7" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.id}
                    </p>
                    <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {item.study}
                    </h3>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.clinic}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {item.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Informe médico · <FileImage className="h-4 w-4" />
                    {item.images} imágenes
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge
                    variant="neutral"
                    className={cn(
                      "w-fit border-0",
                      item.status === "Nuevo"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    )}
                  >
                    {item.status}
                  </Badge>
                  <Button
                    size="sm"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    onClick={() => navigate(`/resultados/${item.id}`)}
                  >
                    <FileText className="h-4 w-4" />
                    Ver resultado
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </article>
            ))}
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
                value="3"
                label="Resultados disponibles"
                detail="Listos para consultar"
                tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              />
              <SummaryItem
                icon={Bell}
                value="1"
                label="Resultado nuevo"
                detail="Sin consultar"
                tone="bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-300"
              />
              <SummaryItem
                icon={Calendar}
                value="10/9/2026, 11:32"
                label="Última actualización"
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
                Los resultados incluyen el informe médico y las imágenes de tu
                estudio.
              </p>
              <p className="flex gap-3">
                <Download className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
                Puedes visualizar y descargar los resultados disponibles en
                cualquier momento.
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
