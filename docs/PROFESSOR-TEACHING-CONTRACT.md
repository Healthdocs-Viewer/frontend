# Contrato de implementación — Docencia del profesor

Este documento define únicamente las funciones académicas del profesor. El profesor conserva aparte su área personal de paciente, con sus propios casos, resultados y notificaciones.

## 1. Estructura

`Docencia` será una pestaña principal con tres subpestañas:

- `Casos`.
- `Estudiantes`.
- `Resultados`.

La asignación desde `Casos` mediante panel lateral es la vía principal. `Estudiantes` ofrece una segunda vía para consultar y reasignar casos.

## 2. Casos

### Listado

- Título `Casos de docencia` y descripción breve.
- Buscador por identificador del caso o estudiante.
- Filtros: `Todos`, `Sin asignar`, `Asignado`, `En procesamiento`, `Resultado cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Identificador, fecha de recepción, estado, estudiante asignado y última actualización.
- Acciones para abrir el detalle y asignar o cambiar estudiante.

### Panel lateral de asignación

Al seleccionar `Asignar estudiante` o `Cambiar asignación` se abre un panel lateral derecho, manteniendo visible la bandeja.

Debe contener:

- Encabezado y botón para cerrar.
- Identificador, fecha y estado del caso.
- Estudiante actual, si existe.
- Buscador por nombre, correo o identificador.
- Lista de estudiantes autorizados.
- Cantidad de casos asignados, si está disponible.
- Selección de un estudiante.
- Botones `Asignar` o `Guardar cambio` y `Cancelar`.

El botón principal permanece deshabilitado sin selección. El cambio de asignación requiere confirmación.

Estados del panel: cargando estudiantes, sin estudiantes, error y guardado exitoso.

### Detalle del caso

Debe organizarse en:

#### Información del caso

- Identificador.
- Fecha de recepción.
- Estado.
- Última actualización.

No se muestra el nombre completo del paciente por defecto; se usa el identificador y solo información autorizada.

#### Gestión académica

- Estudiante asignado.
- Fecha de asignación.
- Estado del procesamiento.
- Acción para asignar o cambiar estudiante, si el permiso existe.

#### Archivos y resultados

- Archivos recibidos, fecha y tamaño.
- Descarga de archivos autorizados.
- Sección `Resultados del caso` con uno o varios resultados.
- Identificador, tipo, fecha, versión y estado de cada resultado.
- Acciones para revisar, descargar o habilitar según permisos.

### Acciones según estado

| Estado del caso | Acciones principales |
|---|---|
| `Sin asignar` | Consultar información básica y asignar estudiante |
| `Asignado` | Consultar, descargar archivos y cambiar asignación si está permitido |
| `En procesamiento` | Consultar, descargar archivos y ver responsable |
| `Resultado cargado` | Revisar, descargar, solicitar corrección o habilitar un resultado |
| `Corrección requerida` | Consultar observación y esperar nueva versión |
| `Disponible para el paciente` | Consultar y descargar resultados disponibles |

## 3. Estudiantes

### Propósito

Consultar estudiantes autorizados y sus casos asignados. Esta es una segunda vía para gestionar asignaciones.

### Contenido

- Buscador por nombre, correo o identificador.
- Nombre, identificador institucional y estado de autorización.
- Cantidad de casos asignados.
- Acción para consultar los casos del estudiante.
- Acción para reasignar un caso usando el mismo panel lateral de `Casos`.

La reasignación debe actualizar la lista y mostrar confirmación solo después de una respuesta exitosa del backend.

## 4. Resultados

### Listado

- Título `Resultados de docencia`.
- Buscador por identificador del caso o estudiante.
- Filtros: `Todos`, `Pendiente`, `Cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Identificador del caso.
- Estudiante responsable.
- Nombre o identificador del resultado.
- Fecha, versión, estado y última actualización.
- Acciones para abrir detalle, revisar, descargar, solicitar corrección o habilitar.

`Pendiente` significa que el caso está asignado pero aún no tiene un resultado cargado. `Cargado` significa que existe un resultado enviado y pendiente de revisión.

### Reglas de resultados

- Un caso puede tener varios resultados independientes.
- Cada resultado conserva su propio estado y versión.
- El profesor puede revisar resultados cargados.
- Para solicitar corrección debe registrar una observación breve.
- Una nueva carga conserva la relación con el mismo caso y vuelve a revisión.
- Un resultado disponible para el paciente no se modifica ni elimina directamente.
- La habilitación requiere confirmación y cambia el resultado a `Disponible para el paciente`.

## 5. Flujo académico

```text
Sin asignar
   ↓ asignar estudiante
Asignado
   ↓ descarga y procesamiento externo
En procesamiento
   ↓ estudiante carga uno o varios resultados
Resultado cargado
   ├── solicitar corrección → Corrección requerida → nueva versión
   └── habilitar resultado → Disponible para el paciente
```

La plataforma no publica automáticamente un resultado solo porque fue recibido.

## 6. Permisos

- Solo se muestran casos habilitados para el profesor.
- Solo se muestran estudiantes autorizados.
- Asignar, reasignar, descargar, revisar y habilitar requieren validación del backend.
- La interfaz no debe asumir que todos los profesores tienen las mismas acciones.
- El estudiante es quien carga los resultados; el profesor los revisa, solicita correcciones o los habilita según sus permisos.

## 7. Estados alternativos y errores

- Cargando información.
- Sin casos, estudiantes o resultados.
- Sin coincidencias de búsqueda o filtros.
- Error de carga, descarga, asignación o habilitación.
- Conflicto porque otro usuario modificó el caso.
- Pérdida de permisos durante una acción.
- Resultado incorrecto o incompleto.
- Resultado ya habilitado.

La interfaz debe explicar qué ocurrió y cuál es la siguiente acción. Las acciones sensibles requieren confirmación, no se debe depender solo del color y los mensajes no deben exponer información personal innecesaria del paciente.

## 8. Criterio de finalización

La implementación del profesor está completa cuando puede consultar casos habilitados, asignarlos o reasignarlos, consultar estudiantes, revisar resultados y habilitarlos para el paciente respetando permisos.
