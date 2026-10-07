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

Consultar casos académicos, identificar casos sin asignar y asignarlos o reasignarlos a investigadores autorizados.

### Elementos de la vista

- Título `Casos de docencia`.
- Descripción breve.
- Buscador por identificador del caso o investigador.
- Filtros: `Todos`, `Sin asignar`, `Asignado`, `En procesamiento`, `Resultado cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Tabla o lista de casos.

### Columnas del listado

- Identificador del caso.
- Fecha de recepción.
- Estado.
- Investigador asignado.
- Última actualización.
- Acciones.

### Acciones del listado

- `Ver detalle`.
- `Asignar investigador` cuando no exista asignación.
- `Cambiar asignación` cuando ya exista y el permiso lo permita.

### Estados de la vista

- Cargando.
- Sin casos disponibles.
- Sin coincidencias para el filtro o búsqueda.
- Error al cargar.
- Caso actualizado correctamente.

## 3. Panel lateral — Asignar o cambiar investigador

El panel aparece desde el lado derecho y mantiene visible la bandeja de casos.

### Contenido

- Encabezado `Asignar investigador` o `Cambiar asignación`.
- Botón para cerrar.
- Identificador, fecha y estado del caso.
- Investigador actual, si existe.
- Buscador por nombre, correo o identificador institucional.
- Lista de investigadores autorizados.
- Cantidad de casos asignados por investigador, si está disponible.
- Selección de un investigador.
- Botón `Asignar` o `Guardar cambio`.
- Botón `Cancelar`.

### Reglas

- El botón principal permanece deshabilitado sin una selección.
- Cambiar una asignación requiere confirmación.
- La interfaz se actualiza solo después de una respuesta exitosa del backend.
- Si falla la operación, se conserva la selección y se permite reintentar.

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
