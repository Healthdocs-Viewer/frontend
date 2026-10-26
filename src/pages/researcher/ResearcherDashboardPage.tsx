import React from "react";
import { Link } from "react-router-dom";
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, Clock3, Download,
  FileCheck2, FileText, FolderOpen, Search, UploadCloud,
} from "lucide-react";
import { getAcademicCases } from "../../services/academicCases";
import { getResearcherResults } from "../../services/researcherResults";
import type { AcademicCaseItem } from "../../types/academicCases";
import type { ResearcherResultsResponse } from "../../types/researcherResults";

type DashboardData = { cases: AcademicCaseItem[]; results: ResearcherResultsResponse["items"] };

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(value));
};

const caseStatus: Record<AcademicCaseItem["status"], { label: string; className: string }> = {
  FILES_RECEIVED: { label: "Pendiente", className: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" },
  INPUT_CHANGE_DRAFT: { label: "Cambio en edición", className: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" },
  INPUT_CHANGE_REVIEW: { label: "Cambio en revisión", className: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" },
  ENABLED_FOR_PROCESSING: { label: "En procesamiento", className: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300" },
  RESULT_UPLOADED: { label: "Resultado cargado", className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300" },
  RESULT_AVAILABLE: { label: "Disponible", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" },
};

const MetricCard = ({ title, value, detail, icon: Icon, tone }: {
  title: string; value: number; detail: string; icon: typeof FolderOpen; tone: string;
}) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
    <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
    <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
  </article>
);

export const ResearcherDashboardPage = () => {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    Promise.all([getAcademicCases(), getResearcherResults()])
      .then(([cases, results]) => { if (active) setData({ cases, results: results.items }); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">No se pudo cargar tu resumen. Intenta de nuevo desde Casos asignados.</div>;
  if (!data) return <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Preparando tu espacio de investigación…</div>;

  const cases = data.cases;
  const results = data.results;
  const pendingCases = cases.filter((item) => ["FILES_RECEIVED", "ENABLED_FOR_PROCESSING", "INPUT_CHANGE_DRAFT", "INPUT_CHANGE_REVIEW"].includes(item.status)).length;
  const processingCases = cases.filter((item) => item.status === "ENABLED_FOR_PROCESSING").length;
  const correctionResults = results.filter((item) => item.status === "CORRECTION_REQUIRED");
  const uploadedResults = results.filter((item) => item.status === "UPLOADED");
  const recentCases = [...cases].sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt)).slice(0, 4);
  const recentResults = [...results].sort((a, b) => (b.updatedAt ?? b.uploadedAt ?? "").localeCompare(a.updatedAt ?? a.uploadedAt ?? "")).slice(0, 3);

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Espacio del estudiante investigador</div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Tu trabajo, en un solo lugar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Consulta tus casos asignados, avanza su análisis y sigue los resultados que has cargado.</p>
        </div>
        <Link to="/casos_asignados" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"><FolderOpen className="h-4 w-4" /> Abrir mis casos <ArrowRight className="h-4 w-4" /></Link>
      </header>

      <section aria-label="Resumen de trabajo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Casos asignados" value={cases.length} detail="en tu espacio de trabajo" icon={FolderOpen} tone="bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300" />
        <MetricCard title="Por avanzar" value={pendingCases} detail="pendientes o en procesamiento" icon={Clock3} tone="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" />
        <MetricCard title="Resultados cargados" value={uploadedResults.length} detail="en espera de revisión" icon={UploadCloud} tone="bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300" />
        <MetricCard title="Correcciones solicitadas" value={correctionResults.length} detail="requieren una actualización" icon={Activity} tone="bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300" />
      </section>

      {correctionResults.length > 0 && <Link to="/resultados_cargados" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 dark:bg-amber-400/10"><Activity className="h-4 w-4" /></span><span><strong className="block text-sm">Tienes {correctionResults.length} resultado{correctionResults.length > 1 ? "s" : ""} con correcciones solicitadas</strong><span className="mt-0.5 block text-xs opacity-80">Revisa los comentarios y carga una versión actualizada.</span></span></span><span className="inline-flex items-center gap-1 text-sm font-semibold">Revisar <ArrowRight className="h-4 w-4" /></span></Link>}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><h2 className="font-semibold text-slate-900 dark:text-white">Casos asignados recientemente</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Continúa con el caso que tienes en curso</p></div><Link to="/casos_asignados" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Ver todos <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-300"><th className="px-5 py-3">Caso / estudio</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Actualizado</th><th className="px-5 py-3" /></tr></thead><tbody>{recentCases.length === 0 ? <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Aún no tienes casos asignados. Cuando te asignen uno, aparecerá aquí.</td></tr> : recentCases.map((item) => <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><p className="font-medium text-slate-800 dark:text-slate-100">{item.referenceCode}</p><p className="mt-0.5 max-w-[260px] truncate text-xs text-slate-500 dark:text-slate-400">{item.studyName}</p></td><td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${caseStatus[item.status].className}`}>{caseStatus[item.status].label}</span></td><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDate(item.updatedAt ?? item.createdAt)}</td><td className="px-5 py-4 text-right"><Link aria-label={`Abrir caso ${item.referenceCode}`} to={`/casos_asignados/${item.referenceCode}`} className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300"><ArrowRight className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">En qué vas</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Estado de tus casos activos</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300"><Activity className="h-4 w-4" /></span></div><div className="mt-6 space-y-5"><div><div className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">En procesamiento</span><strong className="text-slate-900 dark:text-white">{processingCases}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-sky-500" style={{ width: `${cases.length ? Math.max(6, (processingCases / cases.length) * 100) : 0}%` }} /></div></div><div><div className="flex items-center justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">Resultados listos</span><strong className="text-slate-900 dark:text-white">{results.filter((item) => item.status === "AVAILABLE").length}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${results.length ? Math.max(6, (results.filter((item) => item.status === "AVAILABLE").length / results.length) * 100) : 0}%` }} /></div></div></div><div className="mt-6 rounded-xl bg-indigo-50 p-4 dark:bg-indigo-400/10"><p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">¿Listo para continuar?</p><p className="mt-1 text-xs leading-5 text-indigo-800/80 dark:text-indigo-200/75">Abre tus casos para descargar los archivos de entrada y registrar los resultados del análisis.</p><Link to="/casos_asignados" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300">Ir a casos asignados <ArrowRight className="h-3.5 w-3.5" /></Link></div></article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900 dark:text-white">Resultados recientes</h2><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Archivos que has entregado para tus casos</p></div><Link to="/resultados_cargados" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300">Ver resultados <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{recentResults.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Todavía no has cargado resultados.</p> : recentResults.map((result) => <div key={result.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${result.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300" : result.status === "CORRECTION_REQUIRED" ? "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300"}`}><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{result.originalFilename}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{result.case.referenceCode} · {result.case.studyName}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${result.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : result.status === "CORRECTION_REQUIRED" ? "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" : "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"}`}>{result.status === "AVAILABLE" ? <BadgeCheck className="h-3.5 w-3.5" /> : result.status === "CORRECTION_REQUIRED" ? <Clock3 className="h-3.5 w-3.5" /> : <FileCheck2 className="h-3.5 w-3.5" />}{result.status === "AVAILABLE" ? "Disponible" : result.status === "CORRECTION_REQUIRED" ? "Corregir" : "Cargado"}</span><span className="w-full pl-12 text-[11px] text-slate-400 dark:text-slate-500">Actualizado {formatDate(result.updatedAt ?? result.uploadedAt)}</span></div>)}</div></article>
        <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-sm"><div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[24px] border-white/5" /><div className="relative"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Search className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold">Tu espacio, tus casos</h2><p className="mt-1 text-sm leading-6 text-indigo-100">Trabaja únicamente sobre los casos asignados a ti. Desde el detalle puedes revisar archivos, cargar resultados y atender correcciones.</p><Link to="/casos_asignados" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Explorar casos <ArrowUpRight className="h-4 w-4" /></Link><div className="mt-6 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-indigo-100"><Download className="h-3.5 w-3.5" /> Acceso a archivos autorizados</div></div></article>
      </section>
      <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">Resumen de tus asignaciones · Los datos se actualizan desde tus casos y resultados</p>
    </div>
  );
};
