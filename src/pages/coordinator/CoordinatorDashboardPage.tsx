import React from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpenCheck,
  Check, ChevronRight, CircleAlert, ClipboardList, Clock3, FileCheck2,
  FolderKanban, Plus, UserRoundPlus, UsersRound,
} from "lucide-react";
import { getCoordinatorDashboard, type CoordinatorDashboardData, type CoordinatorDashboardCase } from "../../services/coordinatorDashboard";

const statusLabels: Record<CoordinatorDashboardCase["status"], string> = {
  FILES_RECEIVED: "Por asignar",
  ENABLED_FOR_PROCESSING: "En proceso",
  INPUT_CHANGE_REVIEW: "Revisión requerida",
  RESULT_UPLOADED: "Resultado cargado",
};

const statusStyle: Record<CoordinatorDashboardCase["status"], string> = {
  FILES_RECEIVED: "bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300",
  ENABLED_FOR_PROCESSING: "bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300",
  INPUT_CHANGE_REVIEW: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300",
  RESULT_UPLOADED: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(value));

const MetricCard = ({ title, value, caption, icon: Icon, accent, trend }: {
  title: string; value: number; caption: string; icon: typeof FolderKanban; accent: string; trend?: "up" | "down";
}) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      {trend && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />} 12%</span>}
    </div>
    <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{caption}</p>
  </article>
);

export const CoordinatorDashboardPage = () => {
  const [dashboard, setDashboard] = React.useState<CoordinatorDashboardData | null>(null);
  React.useEffect(() => {
    let active = true;
    getCoordinatorDashboard().then((data) => { if (active) setDashboard(data); });
    return () => { active = false; };
  }, []);

  if (!dashboard) return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">Preparando tu resumen…</div>;

  const maxCases = Math.max(...dashboard.weeklyActivity.map((item) => item.cases));
  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Espacio de coordinación</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Buenos días, coordinador</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Aquí tienes el estado de los estudios académicos y lo que requiere tu atención.</p>
        </div>
        <Link to="/casos_academicos" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"><Plus className="h-4 w-4" /> Gestionar casos <ChevronRight className="h-4 w-4 opacity-75" /></Link>
      </header>

      <section aria-label="Resumen de casos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Casos activos" value={dashboard.metrics.activeCases} caption="en tu espacio" icon={FolderKanban} accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300" trend="up" />
        <MetricCard title="Por asignar" value={dashboard.metrics.waitingAssignment} caption="esperan investigador" icon={UserRoundPlus} accent="bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200" />
        <MetricCard title="En procesamiento" value={dashboard.metrics.inProgress} caption="con investigador" icon={Activity} accent="bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300" trend="up" />
        <MetricCard title="Requieren revisión" value={dashboard.metrics.needsReview} caption="pendientes de acción" icon={CircleAlert} accent="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div><h2 className="font-semibold text-slate-900 dark:text-white">Casos que requieren atención</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Prioriza asignaciones y revisiones pendientes</p></div>
            <Link to="/casos_academicos" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Ver bandeja <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300"><th className="px-5 py-3">Caso / estudio</th><th className="px-4 py-3">Investigador</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Recibido</th><th className="px-5 py-3" /></tr></thead>
              <tbody>{dashboard.attentionCases.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4"><p className="font-medium text-slate-800 dark:text-slate-100">{item.referenceCode}</p><p className="mt-0.5 max-w-[230px] truncate text-xs text-slate-500 dark:text-slate-400">{item.studyName}</p></td>
                  <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">{item.researcher}</td>
                  <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${statusStyle[item.status]}`}>{statusLabels[item.status]}</span></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.receivedAt)}</td>
                  <td className="px-5 py-4 text-right"><Link aria-label={`Abrir caso ${item.referenceCode}`} to={item.status === "FILES_RECEIVED" ? "/casos_academicos" : `/casos_academicos/${item.referenceCode}`} className="inline-flex rounded-lg p-2 text-slate-400 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300"><ChevronRight className="h-4 w-4" /></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">Actividad de casos</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Últimos 7 días</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"><ClipboardList className="h-4 w-4" /></span></div>
          <div className="mt-7 flex h-36 items-end justify-between gap-2" role="img" aria-label={`Casos recibidos durante la semana: ${dashboard.weeklyActivity.map((d) => `${d.day} ${d.cases}`).join(", ")}`}>
            {dashboard.weeklyActivity.map((item) => <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-medium text-slate-400 dark:text-slate-300">{item.cases}</span><div className="w-full max-w-7 rounded-t-md bg-indigo-100 dark:bg-indigo-400/15" style={{ height: `${Math.max(12, (item.cases / maxCases) * 82)}%` }}><div className="h-full rounded-t-md bg-indigo-500" style={{ height: `${Math.max(28, (item.cases / maxCases) * 100)}%` }} /></div><span className="text-[10px] text-slate-400 dark:text-slate-300">{item.day}</span></div>)}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800"><span className="text-slate-500 dark:text-slate-400">Recibidos esta semana</span><span className="font-semibold text-slate-800 dark:text-slate-100">36 casos</span></div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">Actividad reciente</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Actualizaciones de tu espacio académico</p></div><button type="button" aria-label="Notificaciones" className="rounded-lg p-2 text-slate-400 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"><Bell className="h-4 w-4" /></button></div>
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">{dashboard.activity.map((item) => <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.tone === "green" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" : item.tone === "amber" ? "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" : "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300"}`}>{item.tone === "green" ? <FileCheck2 className="h-4 w-4" /> : item.tone === "amber" ? <Clock3 className="h-4 w-4" /> : <BookOpenCheck className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</p></div><span className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-300">{item.time}</span></div>)}</div>
        </article>
        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-sm">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[24px] border-white/5" /><div className="relative"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><UsersRound className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold">Tu equipo de investigación</h2><p className="mt-1 text-sm leading-6 text-indigo-100">Revisa investigadores y organiza el acceso a los casos de tu espacio.</p><Link to="/investigadores" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Ver investigadores <ArrowRight className="h-4 w-4" /></Link><div className="mt-6 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-indigo-100"><Check className="h-3.5 w-3.5" /> Asignaciones bajo tu coordinación</div></div>
        </article>
      </section>
      <p className="text-center text-[11px] text-slate-400 dark:text-slate-300">Datos de demostración · El resumen se conectará al servicio académico</p>
    </div>
  );
};
