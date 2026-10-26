# Especificación de pantallas — Coordinador

Este documento traduce el contrato de Docencia en una guía concreta para diseñar e implementar cada ventana y componente del coordinador.

## 1. Dashboard del coordinador

### Navegación principal

El coordinador conserva su área personal y tiene acceso a `Docencia`.

- Inicio.
- Mis casos.
- Docencia.
- Notificaciones.
- Perfil.

La pestaña `Docencia` contiene las funciones académicas. Las funciones de `Mis casos`, resultados personales y notificaciones no deben mezclarse con los casos académicos.

## 2. Docencia — Casos

### Objetivo

Consultar los casos académicos y gestionar las asignaciones de investigadores autorizados.

### Elementos de la vista

- Título `Casos Académicos`.
- Descripción breve.
- Buscador por código del caso o nombre del estudio.
- Filtros: `Todos`, `Archivos recibidos`, `En procesamiento`, `Cambio en edición`, `Cambio pendiente de revisión`, `Resultado cargado` y `Disponible para el paciente`.
- Tabla o lista de casos.

### Columnas del listado

- Identificador del caso.
- Fecha de recepción.
- Estado.
- Última actualización.
- Acciones.

El investigador asignado se consulta desde el panel de gestión de acceso, no como columna del listado. Búsqueda, estado, orden y paginación se resuelven en el backend.

### Acciones del listado

- `Ver detalle`.
- `Gestionar acceso`, que permite consultar asignaciones vigentes y editar el conjunto cuando el estado del caso lo permite.

### Estados de la vista

- Cargando.
- Sin casos disponibles.
- Sin coincidencias para el filtro o búsqueda.
- Error al cargar.
- Caso actualizado correctamente.

## 3. Panel lateral — Gestionar acceso de investigadores

El panel aparece desde el lado derecho y mantiene visible la bandeja de casos.

### Contenido

- Encabezado `Gestionar acceso de investigadores`.
- Botón para cerrar.
- Identificador y estado del caso.
- Solo investigadores asignados al abrir. Si no hay asignaciones, mostrar un mensaje vacío con orientación para buscar.
- Buscador por nombre, correo o identificador institucional.
- Consultar el directorio solo después de que el coordinador escriba una búsqueda.
- Lista de investigadores autorizados que coinciden con la búsqueda.
- Selección de varios investigadores; conservar las selecciones al cambiar de búsqueda.
- Botón `Guardar cambios`.
- Botón `Cancelar`.

### Reglas

- El botón principal permanece deshabilitado si no hay cambios.
- Los casos en `INPUT_CHANGE_DRAFT` o `INPUT_CHANGE_REVIEW` son de solo consulta; deshabilitar selección y guardado.
- Guardar reemplaza atómicamente el conjunto de asignaciones.
- La interfaz confirma el guardado solo después de una respuesta exitosa del backend y mantiene abierto el panel.
- Si falla la operación, se conserva la selección y se permite reintentar.
- Sin búsqueda, mostrar solo las asignaciones vigentes; sin asignaciones, indicar que no hay investigadores asignados e invitar a buscar.
- Con búsqueda, mostrar coincidencias del directorio junto con cualquier persona asignada que siga fuera de los resultados; buscar no cambia ni guarda la selección.

## 4. Detalle del caso

Puede abrirse como página o panel, según la navegación definida por el frontend.

### Bloque de información del caso

- Identificador.
- Fecha de recepción.
- Estado.
- Última actualización.

No mostrar el nombre completo del paciente por defecto. Mostrar únicamente la información personal autorizada.

### Bloque de gestión académica

- Investigador asignado.
- Fecha de asignación.
- Estado del procesamiento.
- Acción para asignar o cambiar investigador, si corresponde.

### Bloque de archivos

- Lista de archivos recibidos.
- Nombre del archivo.
- Fecha.
- Tamaño.
- Acción `Descargar` para archivos autorizados.

### Bloque de resultados

- Título `Resultados del caso`.
- Lista de uno o varios resultados.
- Identificador o nombre.
- Tipo.
- Fecha de carga.
- Versión.
- Estado individual.
- Acciones según permisos.

## 5. Docencia — Investigadores

### Objetivo

Consultar investigadores autorizados y revisar o reasignar sus casos.

### Elementos de la vista

- Título `Investigadores`.
- Buscador por nombre, correo o identificador.
- Lista o tabla de investigadores.

### Información por investigador

- Nombre.
- Identificador institucional.
- Correo institucional, si corresponde.
- Estado de autorización.
- Cantidad de casos asignados.
- Acción `Ver casos`.

### Acciones

- Abrir los casos del investigador.
- Abrir el detalle de un caso.
- Reasignar un caso mediante el mismo panel lateral de la vista `Casos`.

No incluir creación, edición, bloqueo ni eliminación de investigadores en el MVP.

## 6. Docencia — Resultados

### Objetivo

Revisar los resultados cargados por los investigadores y habilitarlos para el paciente cuando corresponda.

### Elementos de la vista

- Título `Resultados de docencia`.
- Buscador por identificador del caso, resultado o investigador.
- Filtros: `Todos`, `Pendiente`, `Cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Lista o tabla de resultados.

### Columnas del listado

- Identificador del caso.
- Resultado.
- Investigador responsable.
- Fecha de carga.
- Versión.
- Estado.
- Última actualización.
- Acciones.

### Acciones por resultado

- `Ver detalle`.
- `Descargar`.
- `Solicitar corrección`.
- `Habilitar para el paciente`.

### Solicitar corrección

Debe abrir un diálogo o panel que contenga:

- Resultado y caso relacionados.
- Campo obligatorio para la observación.
- Botón `Solicitar corrección`.
- Botón `Cancelar`.

La operación cambia el estado a `Corrección requerida` y conserva la relación con el caso.

### Habilitar para el paciente

Debe solicitar confirmación y mostrar:

- Caso relacionado.
- Resultado que se habilitará.
- Advertencia de que el paciente podrá consultarlo.
- Botón `Habilitar para el paciente`.
- Botón `Cancelar`.

Solo después de una respuesta exitosa se cambia el estado a `Disponible para el paciente`.

## 7. Estados comunes de interfaz

Todas las vistas deben contemplar:

- Cargando.
- Vacío.
- Sin coincidencias.
- Error con opción de reintentar.
- Guardado exitoso.
- Permiso insuficiente.
- Sesión expirada.

Los mensajes deben explicar qué ocurrió y cuál es la siguiente acción. No se debe depender únicamente del color para comunicar estados.

## 8. Flujo completo de la interfaz

```text
Docencia → Casos → Abrir caso → Asignar investigador
                         ↓
              Investigador procesa externamente
                         ↓
Docencia → Resultados → Revisar resultado
                         ├── Solicitar corrección
                         └── Habilitar para el paciente
```

## 9. Criterios de implementación

- Respetar los permisos recibidos desde backend.
- No mostrar acciones no autorizadas.
- Mantener visible el identificador del caso en paneles y confirmaciones.
- Confirmar operaciones sensibles.
- No exponer información personal innecesaria del paciente.
- Actualizar listados solo después de confirmar éxito en backend.
- Reutilizar el mismo panel lateral para asignar y reasignar casos.
