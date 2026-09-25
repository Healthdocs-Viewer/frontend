import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";

const cases = [
  {
    id: "CAS-2026-0042",
    study: "Radiografía de tórax",
    date: "23 sep 2026",
    status: "En procesamiento",
    tone: "info" as const,
    action: "Ver caso",
  },
  {
    id: "CAS-2026-0038",
    study: "Resonancia magnética",
    date: "18 sep 2026",
    status: "Resultado disponible",
    tone: "success" as const,
    action: "Ver resultado",
  },
  {
    id: "CAS-2026-0031",
    study: "Tomografía",
    date: "12 sep 2026",
    status: "Pendiente de archivo",
    tone: "default" as const,
    action: "Cargar archivo",
  },
  {
    id: "CAS-2026-0024",
    study: "Ecografía",
    date: "04 sep 2026",
    status: "Finalizado",
    tone: "neutral" as const,
    action: "Ver caso",
  },
];
const filters = [
  "Todos (12)",
  "Pendientes (2)",
  "En procesamiento (4)",
  "Resultado disponible (3)",
  "Finalizados (3)",
];
type SectionKey = "mis-casos" | "resultados" | "notificaciones";

export const DashboardSectionPage: React.FC<{ section: SectionKey }> = ({
  section,
}) => {
  if (section !== "mis-casos") return <LegacySectionPage section={section} />;
  const [activeFilter, setActiveFilter] = React.useState(filters[0]);
  const [query, setQuery] = React.useState("");
  const visibleCases = cases.filter((item) =>
    `${item.id} ${item.study}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar activePath="/mis-casos" />
      <main className="min-h-screen lg:ml-72">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menú de navegación"
              className="rounded-lg p-1 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm text-slate-400">Workspace /</span>
            <span className="font-medium">Mis casos</span>
          </div>
          <div
            role="img"
            aria-label="Avatar del usuario"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500"
          />
        </header>
        <div className="min-h-screen p-5 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-semibold">Mis casos</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Consulta el estado de tus estudios y resultados.
                </p>
              </div>
              <Button type="button" className="gap-2 self-start sm:self-auto">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Crear nuevo caso
              </Button>
            </header>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative block w-full lg:max-w-lg">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    aria-label="Buscar por código o estudio"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por código o estudio"
                    className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <select
                  aria-label="Ordenar casos"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none"
                >
                  <option>Ordenar: más recientes</option>
                  <option>Ordenar: más antiguos</option>
                </select>
              </div>
              <div
                className="mt-5 flex gap-2 overflow-x-auto pb-1"
                role="tablist"
                aria-label="Filtrar casos"
              >
                {filters.map((filter) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === filter}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeFilter === filter ? "bg-primary/10 text-primary" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">
                        Caso y estudio
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Fecha
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Estado
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleCases.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                              <FileText
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.id}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.study}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {item.date}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={item.tone}>{item.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          >
                            {item.action}
                            <ArrowRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row sm:items-center">
                <span>Mostrando {visibleCases.length} de 12 casos</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Página anterior"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-current="page"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 font-semibold text-white"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    aria-label="Página siguiente"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const LegacySectionPage: React.FC<{
  section: Exclude<SectionKey, "mis-casos">;
}> = ({ section }) => {
  const data =
    section === "resultados"
      ? {
          title: "Resultados",
          description: "Aquí podrás consultar los resultados disponibles.",
          icon: CheckCircle2,
        }
      : {
          title: "Notificaciones",
          description: "Mantente al día con las novedades de tu cuenta.",
          icon: Clock3,
        };
  const Icon = data.icon;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        activePath={
          section === "resultados" ? "/dashboard/resultados" : "/notificaciones"
        }
      />
      <main className="min-h-screen px-5 py-8 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">{data.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{data.description}</p>
        </div>
      </main>
    </div>
  );
};
