import React from 'react';
import { Bell, BriefcaseBusiness, FileText, Home, ArrowLeft } from 'lucide-react';

const sections = {
  'mis-casos': { title: 'Mis casos', description: 'Consulta y gestiona los casos clínicos asignados.', icon: BriefcaseBusiness, items: ['Caso de valoración inicial', 'Seguimiento de paciente', 'Revisión de resultados'] },
  resultados: { title: 'Resultados', description: 'Aquí podrás consultar los resultados disponibles.', icon: FileText, items: ['Resultado de laboratorio', 'Imagen diagnóstica', 'Informe médico'] },
  notificaciones: { title: 'Notificaciones', description: 'Mantente al día con las novedades de tu cuenta.', icon: Bell, items: ['Nuevo caso asignado', 'Resultado publicado', 'Recordatorio de seguimiento'] },
} as const;

type SectionKey = keyof typeof sections;

export const DashboardSectionPage: React.FC<{ section: SectionKey }> = ({ section }) => {
  const data = sections[section];
  const Icon = data.icon;
  return <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 lg:px-12">
    <div className="mx-auto max-w-5xl">
      <a href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Volver al inicio</a>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
<div className="flex items-start gap-4"><div className="rounded-xl bg-slate-100 p-3 text-slate-700"><Icon className="h-7 w-7" /></div><div><h1 className="text-2xl font-semibold">{data.title}</h1><p className="mt-2 text-slate-500">{data.description}</p></div></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">{data.items.map((item, index) => <article key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-indigo-600" /><span className="text-xs text-slate-400">#{index + 1}</span></div><h2 className="mt-5 font-medium">{item}</h2><p className="mt-2 text-sm text-slate-500">Información de ejemplo para esta sección.</p><button className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800">Ver detalle →</button></article>)}</div>
      </div>
      <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"><Home className="h-4 w-4" />Ir al dashboard</a>
    </div>
  </main>;
};
