import { Link } from "react-router-dom";
import { ArrowLeft, CircleHelp } from "lucide-react";

export const HelpPage = () => (
  <section className="mx-auto max-w-2xl space-y-5">
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Volver al inicio
    </Link>
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
          <CircleHelp className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          Ayuda
        </h1>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Si tienes problemas para acceder a tu cuenta o necesitas ayuda con tus
        permisos, contacta al administrador de Healthdocs.
      </p>
    </div>
  </section>
);
