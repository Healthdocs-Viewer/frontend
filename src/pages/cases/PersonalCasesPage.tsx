import React from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { cn } from "../../components/ui/cn";
import { NavLink } from "react-router-dom";

type CaseStatus =
  | "Pendiente de archivo"
  | "En procesamiento"
  | "Resultado disponible"
  | "Finalizado";
type MedicalCase = {
  id: string;
  study: string;
  date: string;
  status: CaseStatus;
};

const cases: MedicalCase[] = [
  {
    id: "CAS-2026-0042",
    study: "Radiografía de tórax",
    date: "23 sep 2026",
    status: "En procesamiento",
  },
  {
    id: "CAS-2026-0038",
    study: "Resonancia magnética",
    date: "18 sep 2026",
    status: "Resultado disponible",
  },
  {
    id: "CAS-2026-0031",
    study: "Tomografía",
    date: "12 sep 2026",
    status: "Pendiente de archivo",
  },
  {
    id: "CAS-2026-0024",
    study: "Ecografía",
    date: "04 sep 2026",
    status: "Finalizado",
  },
];

const statusConfig: Record<
  CaseStatus,
  {
    icon: typeof Clock3;
    variant: "warning" | "success" | "default" | "neutral";
    action: string;
  }
> = {
  "En procesamiento": { icon: Clock3, variant: "warning", action: "Ver caso" },
  "Resultado disponible": {
    icon: CheckCircle2,
    variant: "success",
    action: "Ver resultado",
  },
  "Pendiente de archivo": {
    icon: Clock3,
    variant: "default",
    action: "Cargar archivo",
  },
  Finalizado: { icon: CheckCircle2, variant: "neutral", action: "Ver caso" },
};

export const PersonalCasesPage: React.FC = () => {
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("Todos");
  const [page, setPage] = React.useState(1);
  const [ascending, setAscending] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const pageSize = 4;
  const filters = [
    "Todos",
    "Pendientes",
    "En procesamiento",
    "Resultado disponible",
    "Finalizados",
  ];
  const filteredCases = cases
    .filter((item) => {
      const matchesQuery = `${item.id} ${item.study}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter =
        activeFilter === "Todos" ||
        item.status
          .toLowerCase()
          .includes(
            activeFilter
              .toLowerCase()
              .replace("pendientes", "pendiente")
              .replace("finalizados", "finalizado"),
          );
      return matchesQuery && matchesFilter;
    })
    .sort((a, b) => {
      const comparison = a.date.localeCompare(b.date, "es");
      return ascending ? comparison : -comparison;
    });
  const pageCount = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = filteredCases.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const changeFilter = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };
  const handleAction = (item: MedicalCase) => {
    setFeedback(
      `${item.status === "Pendiente de archivo" ? "Carga de archivo" : item.status === "Resultado disponible" ? "Visualización del resultado" : "Consulta del caso"} preparada para ${item.id}.`,
    );
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
          <NavLink
            to="/mis-casos/nuevo"
            className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:mt-0"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crear nuevo caso
          </NavLink>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por código o estudio"
                aria-label="Buscar casos"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
              />
            </label>
            <Button
              variant="outline"
              onClick={() => setAscending((current) => !current)}
              className="justify-between lg:w-48"
            >
              Ordenar: {ascending ? "más antiguos" : "más recientes"}{" "}
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={activeFilter === filter ? "outline" : "secondary"}
                onClick={() => changeFilter(filter)}
                className={cn(
                  activeFilter === filter &&
                    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
                )}
              >
                {filter}{" "}
                <span className="ml-1 text-xs opacity-70">
                  (
                  {filter === "Todos"
                    ? cases.length
                    : cases.filter((item) =>
                        item.status
                          .toLowerCase()
                          .includes(
                            filter
                              .toLowerCase()
                              .replace("pendientes", "pendiente")
                              .replace("finalizados", "finalizado"),
                          ),
                      ).length}
                  )
                </span>
              </Button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[720px] table-fixed text-left">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[20%]" />
                <col className="w-[25%]" />
                <col className="w-[19%]" />
              </colgroup>
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Caso y estudio</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCases.map((item) => {
                  const config = statusConfig[item.status];
                  const Icon = config.icon;
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 text-sm dark:border-slate-700"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <FileText className="h-4 w-4" />
                          </span>
                          <span>
                            <strong className="block text-slate-800 dark:text-slate-100">
                              {item.id}
                            </strong>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.study}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                        {item.date}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={config.variant}
                          className="w-fit gap-1.5 border-0"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(item)}
                          className="w-fit text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                          {item.status === "Pendiente de archivo" && (
                            <Upload className="h-4 w-4" />
                          )}
                          {config.action}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {feedback && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200"
            >
              {feedback}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando {paginatedCases.length} de {filteredCases.length} casos
            </span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
