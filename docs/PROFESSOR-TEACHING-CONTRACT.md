# Contrato de implementación — Docencia del coordinador

Este documento define únicamente las funciones académicas del coordinador. El coordinador conserva aparte su área personal de paciente, con sus propios casos, resultados y notificaciones.

## 1. Estructura

`Docencia` será una pestaña principal con tres subpestañas:

- `Casos`.
- `Investigadores`.
- `Resultados`.

La asignación desde `Casos` mediante panel lateral es la vía principal. `Investigadores` ofrece una segunda vía para consultar y reasignar casos.

## 2. Casos

### Listado

- Título `Casos Académicos` y descripción breve.
- Buscador por código del caso o nombre del estudio.
- Filtros: `Todos`, `Archivos recibidos`, `En procesamiento`, `Cambio en edición`, `Cambio pendiente de revisión`, `Resultado cargado` y `Disponible para el paciente`.
- Columnas: identificador del caso, fecha de recepción, estado, última actualización y acciones. El investigador no se muestra como columna; se consulta en el drawer de acceso.
- La búsqueda, el estado, el orden por recepción y la página se envían al endpoint; la interfaz muestra la página devuelta por el servidor.
- Acciones para abrir el detalle y asignar o cambiar investigador.

### Panel lateral de asignación

Al seleccionar `Gestionar acceso` se abre un panel lateral derecho, manteniendo visible la bandeja.

Debe contener:

- Encabezado y botón para cerrar.
- Identificador y estado del caso.
- Solo las asignaciones vigentes al abrir el panel. Si no hay ninguna, mostrar un estado vacío que invita a buscar.
- Buscador por nombre, correo o identificador.
- Los resultados del directorio se consultan al escribir; no cargar el directorio completo al abrir el panel.
- Lista de investigadores autorizados que coinciden con la búsqueda.
- Selección de varios investigadores; conservar el borrador al cambiar la búsqueda.
- Botones `Guardar cambios` y `Cancelar`.

El botón principal permanece deshabilitado si no hay cambios. Los cambios se guardan en lote de forma atómica.

Estados del panel: cargando asignaciones, sin investigadores asignados, buscando resultados, sin coincidencias, error y guardado exitoso. Tras guardar correctamente, mostrar confirmación en el panel y mantenerlo abierto.

Los casos en `INPUT_CHANGE_DRAFT` o `INPUT_CHANGE_REVIEW` permiten consultar asignaciones, pero no modificarlas. Deshabilitar selección y guardado mientras la solicitud esté abierta.

### Detalle del caso

Debe organizarse en:

#### Información del caso

- Identificador.
- Fecha de recepción.
- Estado.
- Última actualización.

No se muestra el nombre completo del paciente por defecto; se usa el identificador y solo información autorizada.

#### Gestión académica

- Investigador asignado.
- Fecha de asignación.
- Estado del procesamiento.
- Acción para asignar o cambiar investigador, si el permiso existe.

#### Archivos y resultados

- Archivos recibidos, fecha y tamaño.
- Descarga de archivos autorizados.
- Sección `Resultados del caso` con uno o varios resultados.
- Identificador, tipo, fecha, versión y estado de cada resultado.
- Acciones para revisar, descargar o habilitar según permisos.

### Acciones según estado

| Estado del caso | Acciones principales |
|---|---|
| `Archivos recibidos` | Consultar información y gestionar investigadores autorizados |
| `En procesamiento` | Consultar y gestionar investigadores autorizados si no hay una solicitud de cambio abierta |
| `Cambio en edición` / `Cambio pendiente de revisión` | Consultar asignaciones; no modificarlas mientras la solicitud esté abierta |
| `En procesamiento` | Consultar, descargar archivos y ver responsable |
| `Resultado cargado` | Revisar, descargar, solicitar corrección o habilitar un resultado; gestionar investigadores si está permitido |
| `Disponible para el paciente` | Consultar y descargar resultados disponibles |

## 3. Investigadores

### Propósito

Consultar investigadores autorizados y sus casos asignados. Esta es una segunda vía para gestionar asignaciones.

### Contenido

- Buscador por nombre, correo o identificador.
- Nombre, identificador institucional y estado de autorización.
- Cantidad de casos asignados.
- Acción para consultar los casos del investigador.
- Acción para reasignar un caso usando el mismo panel lateral de `Casos`.

La reasignación debe actualizar la lista y mostrar confirmación solo después de una respuesta exitosa del backend.

## 4. Resultados

### Listado

- Título `Resultados de docencia`.
- Buscador por identificador del caso o investigador.
- Filtros: `Todos`, `Pendiente`, `Cargado`, `Corrección requerida` y `Disponible para el paciente`.
- Identificador del caso.
- Investigador responsable.
- Nombre o identificador del resultado.
- Fecha, versión, estado y última actualización.
- Acciones para abrir detalle, revisar, descargar, solicitar corrección o habilitar.

`Pendiente` significa que el caso está asignado pero aún no tiene un resultado cargado. `Cargado` significa que existe un resultado enviado y pendiente de revisión.

### Reglas de resultados

- Un caso puede tener varios resultados independientes.
- Cada resultado conserva su propio estado y versión.
- El coordinador puede revisar resultados cargados.
- Para solicitar corrección debe registrar una observación breve.
- Una nueva carga conserva la relación con el mismo caso y vuelve a revisión.
- Un resultado disponible para el paciente no se modifica ni elimina directamente.
- La habilitación requiere confirmación y cambia el resultado a `Disponible para el paciente`.

## 5. Flujo académico

```text
Sin asignar
   ↓ asignar investigador
Asignado
   ↓ descarga y procesamiento externo
En procesamiento
   ↓ investigador carga uno o varios resultados
Resultado cargado
   ├── solicitar corrección → Corrección requerida → nueva versión
   └── habilitar resultado → Disponible para el paciente
```

La plataforma no publica automáticamente un resultado solo porque fue recibido.

## 6. Permisos

- Solo se muestran casos habilitados para el coordinador.
- Solo se muestran investigadores autorizados.
- Asignar, reasignar, descargar, revisar y habilitar requieren validación del backend.
- La interfaz no debe asumir que todos los coordinadores tienen las mismas acciones.
- El investigador es quien carga los resultados; el coordinador los revisa, solicita correcciones o los habilita según sus permisos.

## 7. Estados alternativos y errores

- Cargando información.
- Sin casos, investigadores o resultados.
- Sin coincidencias de búsqueda o filtros.
- Error de carga, descarga, asignación o habilitación.
- Conflicto porque otro usuario modificó el caso.
- Pérdida de permisos durante una acción.
- Resultado incorrecto o incompleto.
- Resultado ya habilitado.

La interfaz debe explicar qué ocurrió y cuál es la siguiente acción. Las acciones sensibles requieren confirmación, no se debe depender solo del color y los mensajes no deben exponer información personal innecesaria del paciente.

## 8. Criterio de finalización

La implementación del coordinador está completa cuando puede consultar casos habilitados, asignarlos o reasignarlos, consultar investigadores, revisar resultados y habilitarlos para el paciente respetando permisos.
