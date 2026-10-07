import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Folder,
  Plus,
  Upload,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  ActivityItem,
  Mini,
  NextStep,
} from "../../components/dashboard/DashboardCards";
import { getPatientDashboard } from "../../services/patientDashboard";
import type {
  ActivityType,
  NextStepType,
  PatientDashboardResponse,
} from "../../types/patientDashboard";

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
const caseStatus: Record<
  PatientDashboardResponse["recentCases"][number]["status"],
  { label: string; variant: "default" | "info" | "success" }
> = {
  CREATED: { label: "Creado", variant: "default" },
  FILES_RECEIVED: { label: "Archivos recibidos", variant: "info" },
  ENABLED_FOR_PROCESSING: { label: "En proceso", variant: "info" },
  RESULT_UPLOADED: { label: "Resultado cargado", variant: "info" },
  RESULT_AVAILABLE: { label: "Resultado disponible", variant: "success" },
};
const stepIcons: Record<NextStepType, typeof FileText> = {
  ACCEPT_CONSENT: ClipboardCheck,
  UPLOAD_FILE: Upload,
  VIEW_RESULT: FileText,
  SIGN_AUTHORIZATION: ClipboardCheck,
  SCHEDULE_FOLLOW_UP: CalendarClock,
  DOWNLOAD_REPORT: Download,
};
const activityStyle: Record<
  ActivityType,
  { icon: typeof FileText; tone: "emerald" | "indigo" | "blue" | "rose" }
> = {
  CASE_CREATED: { icon: FileText, tone: "indigo" },
  CONSENT_ACCEPTED: { icon: CheckCircle2, tone: "blue" },
  FILE_UPLOADED: { icon: FileText, tone: "indigo" },
  RESULT_PUBLISHED: { icon: CheckCircle2, tone: "emerald" },
  CASE_STATUS_CHANGED: { icon: FileText, tone: "blue" },
  NOTIFICATION_SENT: { icon: Bell, tone: "rose" },
  DOCUMENT_RECEIVED: { icon: Upload, tone: "indigo" },
  REMINDER_SENT: { icon: Bell, tone: "rose" },
  RESULT_VIEWED: { icon: CheckCircle2, tone: "emerald" },
  PERSONAL_DATA_CONFIRMED: { icon: CheckCircle2, tone: "blue" },
  CASE_ARCHIVED: { icon: CheckCircle2, tone: "emerald" },
  MEDICAL_ORDER_ADDED: { icon: FileText, tone: "indigo" },
};

export const PatientDashboardPage = () => {
  const [dashboard, setDashboard] =
    React.useState<PatientDashboardResponse | null>(null);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    getPatientDashboard()
      .then((data) => {
        if (mounted) setDashboard(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  if (error) return <p role="alert">No fue posible cargar el dashboard.</p>;
  if (!dashboard) return <p role="status">Cargando dashboard...</p>;
  const { summary, recentCases, nextSteps, recentActivity, availableResults } =
    dashboard;
  const visibleRecentCases = recentCases.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resumen general</h1>
        <p className="mt-1 text-sm text-slate-500">
          Una vista rápida de tus estudios y casos médicos.
        </p>
      </div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <div className="border-l-4 border-indigo-600 pl-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Portal del paciente
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Bienvenido al portal del paciente
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Gestiona tus estudios médicos, carga documentos, realiza el
              seguimiento de tus casos y consulta tus resultados de forma segura
              y sencilla.
            </p>
          </div>
          <div className="flex items-center gap-3 text-indigo-300">
            <FileText className="h-14 w-14" />
            <Folder className="h-12 w-12 text-blue-300" />
            <CalendarClock className="h-14 w-14" />
          </div>
          <div className="flex min-w-40 flex-col gap-2">
            <Link
              to="/mis_casos"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nuevo caso
            </Link>
            <Link
              to="/mis_resultados"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <FileText className="h-4 w-4" />
              Ver resultados
            </Link>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Mini
          icon={Folder}
          value={String(summary.activeCases)}
          title="Casos activos"
          detail="Total de casos creados"
          color="text-indigo-500"
        />
        <Mini
          icon={CalendarClock}
          value={String(summary.inProgressCases)}
          title="En proceso"
          detail="Estudios en revisión"
          color="text-blue-500"
        />
        <Mini
          icon={FileText}
          value={String(summary.availableResults)}
          title="Resultados disponibles"
          detail="Listos para consultar"
          color="text-emerald-500"
        />
        <Mini
          icon={Bell}
          value={String(summary.notificationsRequiringAttention)}
          title="Notificaciones"
          detail="Requieren tu atención"
          color="text-rose-500"
        />
      </section>
      <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
        <article className="h-[440px] min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="font-semibold">Mis casos recientes</h2>
            </div>
            <a
              href="/mis_casos"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Ver todos{" "}
              <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
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
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRecentCases.length === 0 && (
                  <tr className="h-[65px]">
                    <td
                      colSpan={5}
                      className="px-5 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Aún no tienes casos recientes.
                    </td>
                  </tr>
                )}
                {visibleRecentCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="h-[65px] border-b border-slate-100 text-slate-600 transition-colors hover:bg-slate-50/70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/70"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700 dark:text-slate-200">
                      {caseItem.referenceCode}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {caseItem.studyName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {formatDate(caseItem.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={caseStatus[caseItem.status].variant}>
                        {caseStatus[caseItem.status].label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-medium"
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
                {Array.from({
                  length: Math.max(
                    0,
                    5 - Math.max(1, visibleRecentCases.length),
                  ),
                }).map((_, index) => (
                  <tr key={`spacer-${index}`} className="h-[65px]">
                    <td colSpan={5} aria-hidden="true" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="flex h-[440px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <h2 className="font-semibold">Próximos pasos</h2>
          </div>
          <div className="relative mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
            {nextSteps.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No tienes pasos pendientes por ahora.
              </p>
            ) : (
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute bottom-7 left-[11px] top-7 w-px bg-slate-200 dark:bg-slate-700"
                />
                <div className="space-y-3">
                  {nextSteps.map((step) => (
                    <NextStep
                      key={step.id}
                      icon={stepIcons[step.type]}
                      title={step.title}
                      caseId={step.caseReferenceCode}
                      description={step.description}
                      action={step.action.label}
                      active={step.priority === "HIGH"}
                      success={
                        step.type === "VIEW_RESULT" ||
                        step.type === "DOWNLOAD_REPORT"
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <article className="order-2 self-start rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="font-semibold">Actividad reciente</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Aún no hay actividad reciente.
            </p>
          ) : (
            <div className="relative mt-5">
              <div className="absolute bottom-7 left-[11px] top-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((item) => (
                  <ActivityItem
                    key={item.id}
                    icon={activityStyle[item.type].icon}
                    tone={activityStyle[item.type].tone}
                    title={item.title}
                    description={item.description}
                    date={formatDate(item.occurredAt)}
                  />
                ))}
              </div>
            </div>
          )}
        </article>
        <article className="order-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="font-semibold">Resultados disponibles</h2>
            </div>
            <a
              href="/mis_resultados"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Ver todos{" "}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          {availableResults.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No tienes resultados disponibles por ahora.
            </p>
          ) : (
            availableResults.map((result) => (
              <div
                key={result.id}
                className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/40"
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {result.caseReferenceCode}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {result.studyName}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(result.availableAt)}
                    </span>
                    <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      El resultado de tu estudio ya está disponible. Puedes
                      descargarlo desde la plataforma.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200">
                      Resultado disponible
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </article>
      </section>
    </div>
  );
};
