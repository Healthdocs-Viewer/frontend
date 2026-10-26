# Prompt para agente — Implementación de interfaces Healthdocs

> Archivo histórico. Resume una etapa anterior de implementación; el estado actual del producto se describe en el [README principal](../../README.md) y los contratos se encuentran en el [índice de documentación](../README.md).

## Prompt

Actúa como un desarrollador frontend senior especializado en React, TypeScript, Tailwind CSS y diseño de interfaces accesibles.

Implementa las interfaces de Healthdocs a partir de la imagen de referencia que te proporcionaré y de los contratos funcionales del proyecto. La imagen define la dirección visual; los contratos definen el contenido, las acciones, los estados y los permisos.

### Fuentes que debes revisar antes de modificar código

1. Imagen de referencia entregada por el usuario.
2. `code/frontend/docs/design/UI-DESIGN-CONTRACT.md`.
3. `code/frontend/docs/roles/coordinador/PROFESSOR-TEACHING-CONTRACT.md`.
4. `code/frontend/docs/roles/investigador/STUDENT-IMPLEMENTATION-CONTRACT.md`.
5. `code/frontend/docs/roles/coordinador/PROFESSOR-SCREEN-SPEC.md`.
6. `code/frontend/docs/roles/investigador/STUDENT-SCREEN-SPEC.md`.
7. Componentes y páginas existentes en `code/frontend/src`.

No inventes flujos, permisos ni datos que contradigan esos documentos. Si la imagen y el contrato difieren, conserva la intención visual de la imagen y respeta el contrato funcional. Señala cualquier conflicto antes de resolverlo.

### Stack y componentes obligatorios

- React y TypeScript.
- Tailwind CSS.
- Componentes reutilizables existentes en `src/components/ui/`.
- Componentes con patrón shadcn/ui cuando el proyecto ya tenga un equivalente o cuando sea necesario crear una pieza reutilizable.
- Iconos exclusivamente de `lucide-react`.
- No uses emojis, SVG manuales ni otra librería de iconos.
- Reutiliza `Button`, `Card`, `Badge`, `IconButton`, `cn` y los componentes de dominio existentes antes de crear duplicados.

### Regla visual principal

La interfaz implementada debe sentirse parte del producto existente. No reemplaces el sistema visual actual por un diseño genérico de shadcn/ui. Conserva la estructura, espaciado, tipografía, colores, radios, sombras, navegación y comportamiento que ya usa Healthdocs, ajustándolos a la imagen de referencia.

### Interfaces del coordinador

Implementa el área `Docencia` con estas subpestañas:

- `Casos`.
- `Investigadores`.
- `Resultados`.

Debe incluir:

- Listado de casos con búsqueda y filtros.
- Panel lateral derecho para asignar o reasignar investigadores.
- Detalle del caso con información, archivos y múltiples resultados.
- Vista de investigadores autorizados y sus casos.
- Vista de resultados con revisión, solicitud de corrección y habilitación para el paciente.
- Confirmaciones para reasignar, solicitar corrección y habilitar resultados.

El coordinador puede asignar o reasignar casos, revisar resultados y habilitarlos según sus permisos. No asumas que todos los coordinadores poseen las mismas acciones.

### Interfaces del investigador

Implementa el área `Investigador` con estas subpestañas:

- `Casos asignados`.
- `Resultados`.

Debe incluir:

- Listado únicamente de casos asignados al investigador.
- Detalle del caso con archivos descargables, observaciones y resultados.
- Panel lateral para añadir resultados.
- Panel lateral para editar resultados.
- Diálogo de confirmación para eliminar resultados.
- Soporte para varios resultados por caso y nuevas versiones.
- Vista de resultados con filtros por estado.

El investigador puede descargar archivos y cargar, editar o eliminar resultados antes de que estén disponibles para el paciente. No puede asignar, reasignar, aprobar, habilitar ni publicar resultados.

### Estados y acciones

Respeta los estados definidos en los contratos. Como mínimo, contempla:

- `Sin asignar`.
- `Asignado`.
- `En procesamiento`.
- `Pendiente`.
- `Cargado`.
- `Corrección requerida`.
- `Disponible para el paciente`.

No permitas editar estados manualmente si el estado debe cambiar como consecuencia de una operación. Los estados deben actualizarse después de una respuesta exitosa del backend.

### Estados de interfaz obligatorios

Cada listado, panel y acción debe contemplar:

- Cargando.
- Vacío.
- Sin coincidencias.
- Error con opción de reintentar.
- Éxito después de guardar.
- Permiso insuficiente.
- Sesión expirada.

Los mensajes deben explicar qué ocurrió y cuál es la siguiente acción. No dependas únicamente del color para comunicar estados.

### Paneles y confirmaciones

- Usa panel lateral derecho para asignar, reasignar, añadir y editar.
- Mantén visible el contexto del caso cuando el diseño lo permita.
- Usa diálogos de confirmación para eliminar, reasignar, solicitar corrección y habilitar resultados.
- Deshabilita la acción principal mientras falten datos obligatorios o exista una operación en progreso.
- Conserva la selección y permite reintentar cuando una operación falle.
- No muestres falso éxito: actualiza la interfaz solo después de confirmar la operación.

### Diseño responsive y accesibilidad

- Implementa mobile-first.
- La tabla debe poder desplazarse horizontalmente en pantallas pequeñas o convertirse en tarjetas/lista cuando corresponda.
- Los paneles laterales deben adaptarse a móvil sin perder controles.
- Implementa modo claro y oscuro usando los tokens y variantes `dark:` existentes.
- Usa jerarquía visual clara, foco visible y controles accesibles.
- Los botones deben tener nombres claros.
- Los iconos sin texto deben usar `aria-label`.
- Las tablas deben usar encabezados accesibles.
- No expongas información personal innecesaria del paciente.

### Arquitectura

- Respeta `DashboardLayout`, `DashboardSidebar`, `DashboardNavbar` y la estructura compartida existente.
- Coloca componentes reutilizables en `src/components/ui/` o en la carpeta de dominio correspondiente.
- Evita duplicar componentes, estilos o lógica.
- Usa tipos explícitos para casos, investigadores, resultados, estados y permisos.
- Mantén separadas las vistas del coordinador y del investigador.
- Si el backend todavía no existe para una interacción, usa datos mock tipados y deja una frontera clara para conectar el servicio después.

### Entrega esperada

1. Inspecciona primero la estructura actual del frontend.
2. Identifica qué componentes se pueden reutilizar.
3. Implementa la interfaz respetando la imagen y los contratos.
4. Añade estados de carga, vacío, error y éxito.
5. Verifica navegación, paneles, confirmaciones y permisos.
6. Comprueba modo claro, modo oscuro y responsive.
7. Corrige los errores de TypeScript o compilación que estén directamente relacionados con la interfaz implementada.
8. Resume los archivos modificados, las decisiones tomadas y cualquier punto que requiera validación.

No ejecutes `npm run build` como requisito de esta tarea mientras las pruebas existentes permanezcan desactualizadas. La validación completa del build se realizará después de actualizar esas pruebas.

No cambies contratos funcionales ni inventes permisos sin documentar primero la decisión.

### Variables que debe completar quien use este prompt

- Imagen de referencia: `[adjuntar imagen o indicar su ruta]`.
- Perfil a implementar: `[coordinador / investigador / ambos]`.
- Ruta o página objetivo: `[indicar ruta]`.
- Datos reales disponibles: `[sí / no]`.
- ¿Debe conectarse al backend en esta iteración?: `[sí / no]`.
