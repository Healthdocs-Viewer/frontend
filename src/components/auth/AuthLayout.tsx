import React from "react";
import { Activity, ArrowUpRight, CheckCircle2, FileText, FolderOpen } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const DashboardPreview = () => (
  <div className="relative mx-auto mt-10 w-full max-w-[520px]">
    <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
    <div className="absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-violet-300/25 blur-3xl" />
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white p-4 text-slate-800 shadow-2xl shadow-indigo-950/30 sm:p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold">Resumen de actividad</p>
            <p className="mt-0.5 text-[10px] text-slate-400">Actualizado recientemente</p>
          </div>
        </div>
        <button type="button" aria-label="Ver resumen" className="grid h-7 w-7 place-items-center rounded-md text-slate-400">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 py-4">
        <div className="rounded-xl bg-indigo-50/80 p-3">
          <p className="text-[10px] font-medium text-indigo-500">Casos activos</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">08</p>
          <div className="mt-2 flex items-end gap-1" aria-hidden="true">
            {[16, 24, 19, 30, 22, 38, 28, 44, 34, 52, 39, 60].map((height, index) => (
              <span key={index} className="flex-1 rounded-t-sm bg-indigo-400/70" style={{ height }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-medium text-slate-500">Resultados listos</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">03</p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Disponibles para consultar
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
          <p className="text-[10px] font-semibold text-slate-600">Actividad reciente</p>
          <span className="text-[9px] font-medium text-indigo-500">Ver todo</span>
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 text-sky-600">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">Nuevo caso registrado</p>
              <p className="mt-0.5 text-[9px] text-slate-400">Caso HD-2026-014 · Hoy</p>
            </div>
            <span className="rounded-full bg-sky-50 px-2 py-1 text-[9px] font-medium text-sky-700">En revisión</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium">Resultado disponible</p>
              <p className="mt-0.5 text-[9px] text-slate-400">Caso HD-2026-009 · Ayer</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-medium text-emerald-700">Listo</span>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-5 -right-4 hidden items-center gap-2 rounded-xl border border-white/70 bg-white px-3 py-2.5 text-slate-700 shadow-xl sm:flex">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[10px] font-semibold">Tus datos protegidos</p>
        <p className="mt-0.5 text-[9px] text-slate-400">Acceso seguro a tu información</p>
      </div>
    </div>
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => (
  <main className="min-h-screen bg-white p-0 dark:bg-slate-900">
    <div className="grid min-h-screen w-full overflow-hidden bg-white dark:bg-slate-900 lg:grid-cols-[1fr_0.92fr]">
      <section className="flex min-w-0 flex-col bg-white px-5 py-5 dark:bg-slate-900 sm:px-8 sm:py-7 lg:px-10 xl:px-14">
        <header className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            Healthdocs
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        <footer className="flex flex-col gap-1 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:pt-0">
          <span>© 2026 Healthdocs. Todos los derechos reservados.</span>
          <span>Plataforma segura para tu información clínica</span>
        </footer>
      </section>

      <aside className="relative hidden min-h-full flex-col justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-8 py-12 text-white lg:flex xl:px-12">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full border-[52px] border-white/[0.06]" />
          <div className="absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full border-[64px] border-white/[0.05]" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100/80">
            Healthdocs Viewer
          </p>
          <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Tus estudios y resultados, en un solo lugar.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100/85">
            Accede de forma segura a tus casos, sigue su progreso y consulta la información que necesitas.
          </p>
          <DashboardPreview />
        </div>
      </aside>
    </div>
  </main>
);
