import React from "react";
import { Check } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

export function Mini({ icon: Icon, value, title, detail, color }: {
  icon: React.ElementType;
  value: string;
  title: string;
  detail: string;
  color: string;
}) {
  return (
    <Card className="p-5">
      <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </Card>
  );
}

export function NextStep({ icon: Icon, title, caseId, description, action, to, active = false, success = false }: {
  icon: React.ElementType;
  title: string;
  caseId: string;
  description: string;
  action: string;
  to?: string;
  active?: boolean;
  success?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className={`relative z-[1] mt-4 grid h-6 w-6 shrink-0 place-items-center rounded-full ${active ? "bg-indigo-600 text-white" : success ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
        {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${active ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300" : success ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}><Icon className="h-4 w-4" aria-hidden="true" /></div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Caso {caseId}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
            </div>
          </div>
          {to ? (
            <Link to={to} className={`inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-indigo-300"}`}>{action}</Link>
          ) : (
            <Button variant={active ? "default" : "outline"} size="sm" className="shrink-0">{action}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityItem({ icon: Icon, tone, title, description, date }: {
  icon: React.ElementType;
  tone: "emerald" | "indigo" | "blue" | "rose";
  title: string;
  description: string;
  date: string;
}) {
  const tones = {
    emerald: "bg-emerald-500 text-white",
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-500 text-white",
    rose: "bg-rose-50 text-rose-500",
  };

  return (
    <div className="relative flex items-start gap-3">
      <div className={`grid h-6 w-6 shrink-0 place-items-center z-[1] rounded-full ${tones[tone]}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <time className="shrink-0 text-xs text-slate-400">{date}</time>
        </div>
      </div>
    </div>
  );
}
