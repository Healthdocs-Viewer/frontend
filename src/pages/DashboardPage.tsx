import React from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CircleHelp,
  FileText,
  Folder,
  Home,
  Upload,
  Download,
  Eye,
  Menu,
  MoreHorizontal,
  Plus,
  Settings,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import {
  ActivityItem,
  Mini,
  NextStep,
} from "../components/dashboard/DashboardCards";

const recentCases = [
  [
    "CAS-20260921-0002",
    "Radiografía de tórax",
    "20/9/2026, 20:45",
    "Creado",
    "indigo",
  ],
  [
    "CAS-20260918-0001",
    "Resonancia de rodilla",
    "18/9/2026, 16:20",
    "En proceso",
    "blue",
  ],
  [
    "CAS-20260910-0005",
    "TAC de abdomen",
    "10/9/2026, 11:32",
    "Resultado disponible",
    "emerald",
  ],
  [
    "CAS-20260905-0003",
    "Radiografía de columna",
    "5/9/2026, 09:15",
    "Acción requerida",
    "amber",
  ],
  [
    "CAS-20260901-0004",
    "Ecografía abdominal",
    "1/9/2026, 14:30",
    "Creado",
    "indigo",
  ],
  [
    "CAS-20260828-0006",
    "Tomografía de cráneo",
    "28/8/2026, 10:05",
    "En proceso",
    "blue",
  ],
  [
    "CAS-20260820-0007",
    "Resonancia lumbar",
    "20/8/2026, 08:40",
    "Resultado disponible",
    "emerald",
  ],
  [
    "CAS-20260815-0008",
    "Radiografía de hombro",
    "15/8/2026, 16:20",
    "Acción requerida",
    "amber",
  ],
];

const ITEMS_PER_PAGE = 5;
const MIN_VISIBLE_ROWS = 3;

const recentActivities = [
  {
    icon: CheckCircle2,
    tone: "emerald" as const,
    title: "Resultado publicado",
    description: "El resultado del caso CAS-20260910-0005 ya está disponible.",
    date: "20/9/2026, 20:17",
  },
  {
    icon: FileText,
    tone: "indigo" as const,
    title: "Archivo cargado",
    description: "Has cargado un archivo para el caso CAS-20260918-0001.",
    date: "18/9/2026, 16:23",
  },
  {
    icon: Check,
    tone: "blue" as const,
    title: "Consentimiento aceptado",
    description: "Has aceptado el consentimiento del caso CAS-20260905-0003.",
    date: "5/9/2026, 09:16",
  },
  {
    icon: BellRing,
    tone: "rose" as const,
    title: "Notificación enviada",
    description: "Te hemos enviado una notificación sobre el caso CAS-20260921-0002.",
    date: "5/9/2026, 09:15",
  },
  {
    icon: Upload,
    tone: "indigo" as const,
    title: "Documento recibido",
    description: "El centro médico recibió el documento solicitado.",
    date: "3/9/2026, 11:40",
  },
  {
    icon: CheckCircle2,
    tone: "emerald" as const,
    title: "Estudio completado",
    description: "El estudio del caso CAS-20260901-0004 fue completado.",
    date: "1/9/2026, 15:12",
  },
  {
    icon: FileText,
    tone: "indigo" as const,
    title: "Informe actualizado",
    description: "Se actualizó el informe de tu resonancia lumbar.",
    date: "28/8/2026, 13:05",
  },
  {
    icon: BellRing,
    tone: "rose" as const,
    title: "Recordatorio enviado",
    description: "Tienes una actividad pendiente en tu portal.",
    date: "25/8/2026, 08:30",
  },
  {
    icon: Check,
    tone: "blue" as const,
    title: "Datos confirmados",
    description: "Tus datos personales fueron confirmados correctamente.",
    date: "22/8/2026, 17:45",
  },
  {
    icon: Upload,
    tone: "indigo" as const,
    title: "Nueva orden médica",
    description: "Se agregó una nueva orden médica a tu caso.",
    date: "20/8/2026, 10:20",
  },
  {
    icon: CheckCircle2,
    tone: "emerald" as const,
    title: "Caso archivado",
    description: "El caso CAS-20260815-0008 fue archivado.",
    date: "15/8/2026, 14:10",
  },
];

export const DashboardPage: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(recentCases.length / ITEMS_PER_PAGE);
  const paginatedCases = recentCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside
        className={`${collapsed ? "w-20" : "w-72"} fixed inset-y-0 left-0 z-10 hidden border-r border-slate-200 bg-white transition-all lg:block`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-900">
              <Activity className="h-4 w-4" />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold">Healthdocs</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Crear nuevo caso"
            className="mt-7 flex items-center gap-3 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            {!collapsed && "Crear nuevo"}
          </button>
          <nav
            aria-label="Navegación principal"
            className="mt-5 space-y-1 text-sm text-slate-600"
          >
            {[
              ["Inicio", Home, "/dashboard"],
              ["Mis casos", BriefcaseBusiness, "/dashboard/mis-casos"],
              ["Resultados", FileText, "/dashboard/resultados"],
              ["Notificaciones", Bell, "/dashboard/notificaciones"],
            ].map(([label, Icon, href]) => (
              <a
                key={label as string}
                href={href as string}
                aria-current={label === "Inicio" ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${label === "Inicio" ? "bg-slate-100 font-medium text-slate-900" : "hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && (label as string)}
              </a>
            ))}
          </nav>
          <div className="mt-auto">
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sistema
              </p>
            )}
            <a
              href="/dashboard/ayuda"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <CircleHelp className="h-4 w-4" />
              {!collapsed && "Ayuda"}
            </a>
            <a
              href="/dashboard/configuracion"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <Settings className="h-4 w-4" />
              {!collapsed && "Configuración"}
            </a>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              <Menu className="h-4 w-4" />
              {!collapsed && "Contraer menú"}
            </button>
          </div>
        </div>
      </aside>
      <main className={`${collapsed ? "lg:pl-20" : "lg:pl-72"} transition-all`}>
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menú de navegación"
              className="rounded-lg p-1 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm text-slate-400">Workspace /</span>
            <span className="font-medium">Inicio</span>
          </div>
          <div
            role="img"
            aria-label="Avatar del usuario"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500"
          />
        </header>
        <div className="space-y-6 p-5 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold">Resumen general</h1>
            <p className="mt-1 text-sm text-slate-500">
              Una vista rápida de tus estudios y casos médicos.
            </p>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
              <div className="border-l-4 border-indigo-600 pl-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  Portal del paciente
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Bienvenido al portal del paciente
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  Gestiona tus estudios médicos, carga documentos, realiza el
                  seguimiento de tus casos y consulta tus resultados de forma
                  segura y sencilla.
                </p>
              </div>
              <div className="flex items-center gap-3 text-indigo-300">
                <FileText className="h-14 w-14" />
                <Folder className="h-12 w-12 text-blue-300" />
                <CalendarClock className="h-14 w-14" />
              </div>
              <div className="flex min-w-40 flex-col gap-2">
                <a
                  href="/dashboard/mis-casos"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo caso
                </a>
                <a
                  href="/dashboard/resultados"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-600"
                >
                  <FileText className="h-4 w-4" />
                  Ver resultados
                </a>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Mini
              icon={Folder}
              value="4"
              title="Casos activos"
              detail="Total de casos creados"
              color="text-indigo-500"
            />
            <Mini
              icon={CalendarClock}
              value="2"
              title="En proceso"
              detail="Estudios en revisión"
              color="text-blue-500"
            />
            <Mini
              icon={FileText}
              value="1"
              title="Resultados disponibles"
              detail="Listos para consultar"
              color="text-emerald-500"
            />
            <Mini
              icon={Bell}
              value="1"
              title="Notificaciones"
              detail="Requieren tu atención"
              color="text-rose-500"
            />
          </section>

          <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
            <article className="min-w-0 self-start overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold">Mis casos recientes</h2>
                </div>
                <a
                  href="/dashboard/mis-casos"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Ver todos{" "}
                  <ArrowRight
                    className="inline h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3">
                        ID del caso
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Estudio
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Fecha de creación
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Estado
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCases.map(([id, study, date, status, tone]) => (
                      <tr
                        key={id}
                        className="text-slate-600 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                          {id}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">{study}</td>
                        <td className="whitespace-nowrap px-4 py-4">{date}</td>
                        <td className="px-4 py-4">
                          <Badge
                            variant={
                              tone === "indigo"
                                ? "default"
                                : tone === "blue"
                                  ? "info"
                                  : tone === "emerald"
                                    ? "success"
                                    : "warning"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="font-medium"
                            >
                              Ver
                            </Button>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              label={`Más acciones para ${id}`}
                              icon={MoreHorizontal}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {Array.from({
                      length: Math.max(
                        0,
                        MIN_VISIBLE_ROWS - paginatedCases.length,
                      ),
                    }).map((_, index) => (
                      <tr key={`empty-row-${index}`} className="h-[73px]">
                        <td colSpan={5} aria-hidden="true" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                  <p className="text-xs text-slate-500">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => page - 1)}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </article>

            <article className="flex h-[500px] min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <h2 className="font-semibold">Próximos pasos</h2>
              </div>
              <div className="relative mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="absolute bottom-7 left-[11px] top-4 w-px bg-slate-200" />
                <div className="space-y-3">
                  <NextStep
                    icon={ClipboardCheck}
                    title="Completar consentimiento"
                    caseId="CAS-20260921-0002"
                    description="Revisa y acepta los términos para continuar con el estudio."
                    action="Completar"
                    active
                  />
                  <NextStep
                    icon={Upload}
                    title="Cargar archivo pendiente"
                    caseId="CAS-20260918-0001"
                    description="Adjunta las imágenes o documentos solicitados por tu centro médico."
                    action="Cargar"
                  />
                  <NextStep
                    icon={FileText}
                    title="Revisar resultado disponible"
                    caseId="CAS-20260910-0005"
                    description="Ya puedes consultar el resultado de tu estudio."
                    action="Ver resultado"
                    success
                  />
                  <NextStep
                    icon={ClipboardCheck}
                    title="Firmar autorización médica"
                    caseId="CAS-20260901-0004"
                    description="Confirma la autorización necesaria para continuar con tu estudio."
                    action="Firmar"
                  />
                  <NextStep
                    icon={Upload}
                    title="Completar documentos"
                    caseId="CAS-20260828-0006"
                    description="Falta adjuntar la orden médica y la identificación del paciente."
                    action="Adjuntar"
                  />
                  <NextStep
                    icon={FileText}
                    title="Descargar informe médico"
                    caseId="CAS-20260820-0007"
                    description="El informe final está listo para descargar y compartir."
                    action="Descargar"
                    success
                  />
                  <NextStep
                    icon={ClipboardCheck}
                    title="Agendar seguimiento"
                    caseId="CAS-20260815-0008"
                    description="Programa una cita de seguimiento con tu centro médico."
                    action="Agendar"
                  />
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <article className="self-start rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold">Actividad reciente</h2>
                </div>
                <a
                  href="/dashboard/actividad"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Ver toda la actividad{" "}
                  <ArrowRight
                    className="inline h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
              <div className="relative mt-5">
                <div className="absolute bottom-7 left-[11px] top-4 w-px bg-slate-200"></div>
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <ActivityItem
                      key={`${activity.title}-${index}`}
                      {...activity}
                    />
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h2 className="font-semibold">Resultados disponibles</h2>
                </div>
                <a
                  href="/dashboard/resultados"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Ver todos{" "}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      CAS-20260910-0005
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-slate-800">
                      TAC de abdomen
                    </h3>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Resultado disponible
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    10/9/2026, 11:32
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Informe y 12 imágenes
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  El resultado de tu estudio ya está disponible. Puedes
                  consultarlo o descargarlo desde la plataforma.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="success" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Eye className="h-3.5 w-3.5" />
                    Ver resultado
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </Button>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
};
