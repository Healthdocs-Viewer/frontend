import React from 'react';
import { Activity, ArrowUpRight, CheckCircle2, Clock3, FileText, HeartPulse, MoreHorizontal, Users } from 'lucide-react';

const cards = [
  { title: 'Pacientes activos', value: '1,248', detail: '+12.5% este mes', icon: Users, tone: 'blue' },
  { title: 'Casos completados', value: '842', detail: '+8.2% este mes', icon: CheckCircle2, tone: 'emerald' },
  { title: 'Pendientes de revisión', value: '36', detail: 'Requieren atención', icon: Clock3, tone: 'amber' },
];

const tones = {
  blue: { box: 'bg-blue-100 text-blue-700', accent: 'text-blue-600', bar: 'bg-blue-500' },
  emerald: { box: 'bg-emerald-100 text-emerald-700', accent: 'text-emerald-600', bar: 'bg-emerald-500' },
  amber: { box: 'bg-amber-100 text-amber-700', accent: 'text-amber-600', bar: 'bg-amber-500' },
};

export const CardDemoPage: React.FC = () => (
  <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">shadcn/ui + Tailwind</p>
          <h1 className="text-2xl font-semibold tracking-tight">Tarjetas personalizables</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Los componentes son una base visual. Puedes cambiar colores, iconos, bordes, contenido y acciones sin quedar limitado por la librería.</p>
        </div>
        <HeartPulse className="hidden h-12 w-12 text-cyan-400 sm:block" />
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        {cards.map(({ title, value, detail, icon: Icon, tone }) => {
          const color = tones[tone as keyof typeof tones];
          return (
            <article key={title} className="group rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition hover:-translate-y-1 hover:border-slate-700">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-3 ${color.box}`}><Icon className="h-5 w-5" /></div>
                <button aria-label={`Más opciones para ${title}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-800 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>
              </div>
              <p className="mt-5 text-sm text-slate-400">{title}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
              <p className={`mt-3 text-sm font-medium ${color.accent}`}>{detail}</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full w-2/3 rounded-full ${color.bar}`} /></div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-xl border border-slate-800 bg-white p-6 text-slate-900 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-cyan-100 p-3 text-cyan-700"><FileText className="h-6 w-6" /></div>
            <div className="flex-1"><div className="flex justify-between gap-3"><div><h2 className="font-semibold">Resultado de laboratorio</h2><p className="mt-1 text-sm text-slate-500">Paciente: María González</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Publicado</span></div><p className="mt-5 text-sm leading-6 text-slate-600">Esta tarjeta combina icono, badge de estado, texto descriptivo y una acción contextual.</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">Ver resultado <ArrowUpRight className="h-4 w-4" /></button></div>
          </div>
        </article>
        <article className="rounded-xl border border-cyan-900/60 bg-gradient-to-br from-cyan-950 to-slate-900 p-6 shadow-xl"><div className="flex items-center gap-3 text-cyan-300"><Activity className="h-5 w-5" /><span className="text-sm font-semibold">Ejemplo de variante</span></div><h2 className="mt-5 text-2xl font-bold">También puede ser oscura</h2><p className="mt-2 text-sm leading-6 text-slate-400">La tarjeta no impone un diseño. Tú decides cómo se ve.</p></article>
      </section>
    </div>
  </main>
);
