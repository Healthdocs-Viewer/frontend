# Contrato de diseño UI — Healthdocs

Este documento define las reglas visuales y estructurales para construir nuevas interfaces en Healthdocs. Su objetivo es mantener consistencia entre páginas, reducir estilos duplicados y facilitar la evolución del producto.

## 1. Alcance del producto

El `DashboardPage` corresponde al portal del paciente. Su contenido debe centrarse en:

- Casos médicos.
- Estudios en proceso.
- Resultados disponibles.
- Notificaciones.
- Actividad reciente.
- Próximos pasos.
- Consentimientos y archivos pendientes.

Las métricas administrativas, como adquisición, retención, visitantes o crecimiento organizacional, deben vivir en un dashboard separado.

## 2. Layout

- Diseñar mobile-first.
- Usar `bg-slate-50` como fondo general de las páginas claras.
- Usar `space-y-6` para separar las secciones principales.
- Usar `gap-4` o `gap-5` en grids y grupos de contenido.
- No usar grids fijas sin breakpoint.
- Las secciones de dos columnas deben colapsar a una columna en mobile y tablet:

```tsx
<section className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(340px,1fr)]">
```

- El contenido principal debe usar `p-5 lg:p-8`.
- Las tablas deben usar `overflow-x-auto` y un ancho mínimo razonable.
- Evitar que una columna fuerce el ancho de la página usando `min-w-0`.

## 3. Tipografía

Usar únicamente estos niveles para interfaces de dashboard:

| Uso | Clases |
| --- | --- |
| Título de página | `text-2xl font-semibold` |
| Título de sección | `text-base font-semibold` |
| Contenido general | `text-sm` |
| Metadata, fechas y estados | `text-xs` |
| Métricas destacadas | `text-2xl font-bold` |

- No usar `text-[10px]`, `text-[11px]` ni otros tamaños arbitrarios.
- No usar `text-3xl` o `text-4xl` en dashboards operativos.
- Usar `leading-5` en descripciones pequeñas.
- Usar `font-semibold` para títulos y `font-medium` para etiquetas o metadata.

## 4. Espaciado

Escala estándar:

| Contexto | Clase recomendada |
| --- | --- |
| Página | `p-5 lg:p-8` |
| Tarjeta estándar | `p-5` |
| Sección destacada | `p-6` |
| Separación de página | `space-y-6` |
| Grid principal | `gap-4` o `gap-5` |
| Grupo compacto | `gap-2` o `gap-3` |
| Control pequeño | `px-3 py-2` |

Evitar crear valores nuevos sin una necesidad visual clara.

## 5. Bordes, radios y sombras

- Tarjetas: `rounded-xl`.
- Botones, inputs y controles: `rounded-lg`.
- Badges: `rounded-full`.
- Bordes: `border-slate-200`.
- Separadores internos: `border-slate-100`.
- Sombra estándar: `shadow-sm`.

## 6. Colores semánticos

Los tokens están definidos en `src/index.css` y registrados en `tailwind.config.js`.

| Token | Significado |
| --- | --- |
| `primary` | Acción principal y navegación activa |
| `info` | Información o proceso |
| `success` | Resultado disponible o completado |
| `warning` | Acción requerida o pendiente |
| `danger` | Error o acción destructiva |
| `content` | Texto principal |
| `muted` | Texto secundario y metadata |
| `surface` | Fondo de tarjetas |
| `border` | Bordes estándar |

Preferir clases semánticas como `bg-primary`, `text-muted`, `border-border` y `bg-success/10` en componentes reutilizables.

## 7. Componentes base

Los componentes reutilizables viven en `src/components/ui/`:

- `Button`: acciones con variantes `default`, `outline`, `secondary`, `ghost`, `success` y `destructive`.
- `Card`: estructura composable con `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` y `CardFooter`.
- `Badge`: estados `neutral`, `info`, `success`, `warning` y `destructive`.
- `IconButton`: acciones que solo contienen un icono y requieren `aria-label`.
- `cn`: utilidad para combinar clases.

Las páginas no deben duplicar las clases base de estos componentes. Se permite sobrescribir estilos puntuales mediante `className` cuando una composición lo necesite.

## 8. Componentes de dominio

Los componentes específicos del producto viven fuera de `ui/`, por ejemplo en `src/components/dashboard/`.

Ejemplos:

- `DashboardCards.tsx`.
- `RecentCasesTable.tsx`.
- `UpcomingSteps.tsx`.
- `RecentActivity.tsx`.
- `AvailableResults.tsx`.

Los componentes de dominio pueden combinar `Card`, `Button`, `Badge` e `IconButton`, pero no deben redefinir sus estilos base.

## 9. Iconografía

- Usar exclusivamente iconos de `lucide-react`.
- No usar emojis, símbolos Unicode o caracteres decorativos como iconos.
- Icono estándar: `h-4 w-4`.
- Icono destacado: `h-5 w-5`.
- Iconos decorativos deben incluir `aria-hidden="true"`.
- Iconos interactivos deben usar `IconButton` y un `aria-label` descriptivo.

## 10. Accesibilidad

- Los botones deben tener `type="button"` por defecto.
- Los enlaces deben navegar; los botones deben ejecutar acciones.
- No usar `href="#"` como placeholder.
- La navegación activa debe usar `aria-current="page"`.
- Las tablas deben usar `scope="col"` en sus encabezados.
- Los controles deben tener `hover`, `focus-visible` y `disabled`.
- Todo icono sin texto visible necesita un nombre accesible.
- Mantener contraste suficiente entre texto y fondo.
- No depender únicamente del color para comunicar un estado.

## 11. Datos y TypeScript

Preferir objetos tipados sobre arrays posicionales:

```tsx
type CaseStatus = "created" | "in_progress" | "result_available" | "action_required";

type PatientCase = {
  id: string;
  study: string;
  createdAt: string;
  status: CaseStatus;
};
```

Esto facilita reutilización, traducciones, filtros y cambios de UI.

## 12. Revisión antes de entregar una pantalla

- [ ] La pantalla tiene una audiencia definida.
- [ ] El layout funciona en mobile, tablet y desktop.
- [ ] No hay tamaños de texto arbitrarios.
- [ ] No hay símbolos Unicode usados como iconos.
- [ ] Las tarjetas usan `Card` cuando son reutilizables.
- [ ] Las acciones usan `Button` o `IconButton`.
- [ ] Los estados usan `Badge`.
- [ ] Los colores respetan los tokens semánticos.
- [ ] Los botones y enlaces tienen comportamiento claro.
- [ ] Los controles tienen estados de foco visibles.
- [ ] Las tablas tienen encabezados accesibles.
- [ ] `npm run build` finaliza correctamente.

## 13. Regla de evolución

Antes de introducir una nueva clase, variante o componente, comprobar si puede resolverse con los tokens y componentes existentes. Si una necesidad se repite en dos o más pantallas, convertirla en un componente reutilizable o en un token documentado.
