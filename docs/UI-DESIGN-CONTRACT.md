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

## 14. Arquitectura del dashboard

- `DashboardPage` es la entrada principal del dashboard.
- `DashboardLayout` es el único responsable de renderizar la estructura compartida:
  - `DashboardSidebar`.
  - `DashboardNavbar`.
  - El contenedor principal.
- Los contenidos internos no deben declarar otro `aside`, `header`, `main` global, sidebar o navbar.
- Los contenidos específicos del dashboard deben vivir en `src/components/dashboard/`.
- Las páginas completas deben vivir en `src/pages/`.
- Los nombres de los componentes deben describir su responsabilidad, por ejemplo:
  - `DashboardHomeContent`.
  - `DashboardCasesContent`.
  - `DashboardResultsContent`.
  - `DashboardNotificationsContent`.
  - `DashboardSettingsContent`.
- Un componente de contenido debe encargarse de su propia sección, no de construir el layout general.
- No duplicar componentes visuales existentes para resolver una necesidad puntual.

## 15. Navegación interna y rutas

- Las rutas internas del dashboard deben utilizar navegación SPA.
- Usar `history.pushState` para actualizar la URL sin recargar toda la aplicación.
- Escuchar `popstate` para soportar correctamente los botones atrás y adelante del navegador.
- Centralizar las rutas dashboard en un único archivo o módulo.
- Mantener `href` en los enlaces internos para conservar accesibilidad y permitir Ctrl/Cmd + click.
- Los enlaces deben navegar; los botones deben ejecutar acciones.
- No usar `href="#"` ni recargas manuales para cambiar de sección.
- El cambio de ruta debe reemplazar únicamente el contenido de `DashboardContent`; el layout compartido debe permanecer montado.

## 16. Librería y componentes existentes

- Usar React y TypeScript con las versiones y configuración existentes del proyecto.
- Usar exclusivamente `lucide-react` para iconografía.
- Reutilizar los componentes de `src/components/ui/` antes de crear componentes equivalentes:
  - `Button`.
  - `IconButton`.
  - `Badge`.
  - `Card` y sus subcomponentes.
  - `cn`.
- Usar los componentes de dominio existentes en `src/components/` cuando resuelvan la necesidad.
- No introducir otra librería de componentes, iconos, estilos o utilidades sin justificarlo y documentarlo.
- No copiar y pegar la implementación de un componente base para crear una variante local.
- Si una variante visual se repite, añadirla al componente base o convertirla en un componente de dominio reutilizable.

## 17. Diseño limpio y consistencia visual

- Mantener interfaces simples, ordenadas y con una jerarquía visual clara.
- Cada pantalla debe tener un objetivo principal identificable.
- Evitar saturar una vista con tarjetas, acciones o métricas que no sean necesarias para la tarea.
- Agrupar información relacionada y separar visualmente los grupos no relacionados.
- Mantener una cantidad razonable de elementos por sección y priorizar el contenido más importante.
- Usar espacios en blanco para mejorar la lectura; no resolver la densidad agregando más bordes o sombras.
- Mantener una sola acción primaria por contexto cuando sea posible.
- Evitar combinaciones innecesarias de colores, gradientes, sombras, bordes o estilos decorativos.
- Las tarjetas deben tener una función clara; no usar tarjetas únicamente para envolver contenido.
- Preferir composiciones sobrias y funcionales sobre elementos ornamentales.
- Los estados vacíos, de carga, error y éxito deben tener una presentación clara y consistente.
- Las interfaces deben conservar coherencia entre desktop, tablet y mobile.

## 18. Preparación para múltiples roles

- El layout debe poder compartirse entre paciente, estudiante y profesor/coordinador.
- No duplicar `DashboardLayout` para cada rol.
- El contenido y la configuración del sidebar pueden variar por rol, pero la estructura visual debe permanecer reutilizable.
- Separar la configuración de navegación y permisos de la presentación visual.
- Preparar los componentes para recibir datos y configuración mediante props.
- No hardcodear información específica de un rol dentro de componentes que posteriormente serán compartidos.
- Las diferencias de rol deben expresarse mediante tipos, configuración o composición, no mediante duplicación completa de páginas.

## 19. Datos y estado de interfaz

- Mantener los datos de presentación separados de la estructura JSX cuando facilite la lectura o reutilización.
- Preferir objetos tipados sobre arrays posicionales.
- Los estados locales deben vivir en el componente que controla la interacción correspondiente.
- No duplicar el mismo estado en el layout y en el contenido sin una razón clara.
- Los datos mock deben identificarse claramente y poder reemplazarse por datos de API sin rehacer la interfaz.
- No mezclar lógica de autenticación, permisos o llamadas de API dentro de componentes puramente visuales.

## 20. Checklist arquitectónico antes de entregar

- [ ] El contenido está ubicado en la carpeta correcta.
- [ ] El nombre del componente refleja su responsabilidad.
- [ ] No se duplican sidebar, navbar ni layout global.
- [ ] Se reutilizan los componentes y la librería existentes.
- [ ] La navegación interna no recarga la aplicación.
- [ ] La ruta está registrada en el módulo central de rutas.
- [ ] La vista funciona con datos vacíos, cargando, error y éxito cuando corresponda.
- [ ] La interfaz es clara y no está visualmente saturada.
- [ ] La pantalla funciona en mobile, tablet y desktop.
- [ ] Se verificaron foco, teclado, etiquetas y estados disabled.
- [ ] `npm run build` finaliza correctamente.
- [ ] Las pruebas relacionadas se ejecutaron o se documentaron sus fallos.
