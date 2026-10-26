# Contrato de datos: casos académicos de coordinación

Contrato de la tabla `/casos_academicos` del coordinador. El esquema canónico del API está en [`backend/openapi/openapi.yaml`](../../../../backend/openapi/openapi.yaml).

## Tabla

La vista presenta identificador del caso, fecha de recepción, estado, última actualización y acciones. No muestra una columna de investigador asignado; el responsable se consulta en el drawer «Gestionar acceso».

- Búsqueda por `referenceCode` o `studyName`, sin distinguir mayúsculas ni tildes.
- Filtro por estado: `FILES_RECEIVED`, `ENABLED_FOR_PROCESSING`, `INPUT_CHANGE_DRAFT`, `INPUT_CHANGE_REVIEW`, `RESULT_UPLOADED` o `RESULT_AVAILABLE`.
- Orden ascendente o descendente por `receivedAt`.
- Paginación de servidor; la interfaz solicita ocho filas por página.
- Los campos de fecha son ISO 8601 UTC. `receivedAt` puede ser `null` para registros históricos sin fecha de recepción persistida; la interfaz muestra «—» en ese caso.

## Endpoint

```http
GET /api/v1/operations/cases/academic?q=torax&status=FILES_RECEIVED&sort=receivedAt,desc&page=0&size=8
Authorization: Bearer <token>
```

Todos los parámetros son opcionales. El backend filtra casos que tienen un archivo INPUT activo y devuelve `items`, paginación y `appliedFilters`. Cada elemento contiene:

| Campo | Uso |
| --- | --- |
| `id` | UUID para detalle y operaciones del caso. |
| `referenceCode` | Identificador legible mostrado en la tabla y ruta. |
| `studyName` | Nombre del estudio; también participa en la búsqueda. |
| `status` | Estado general del caso. |
| `receivedAt` | Fecha oficial de recepción. |
| `updatedAt` | Última actualización persistida del caso. |

La búsqueda, el filtro, el orden y la página se envían al servidor. `totalItems` y `totalPages` corresponden al conjunto que coincide con esos filtros.

## Drawer «Gestionar acceso»

Al abrir una fila, el drawer consulta las asignaciones del caso y muestra solo las vigentes. Si `researcherIds` está vacío, muestra «Aún no hay investigadores asignados» y orienta al coordinador a usar el buscador. El directorio se consulta solo cuando se escribe un término.

Las asignaciones originales permanecen visibles aunque se desmarquen o no coincidan con el término. Los resultados se pueden marcar o desmarcar y la selección se conserva al cambiar la búsqueda. «Guardar cambios» reemplaza atómicamente el conjunto; la confirmación aparece después de una respuesta exitosa y el drawer permanece abierto. Si falla el guardado, se conserva el borrador.

En `INPUT_CHANGE_DRAFT` y `INPUT_CHANGE_REVIEW`, el drawer es de solo consulta: muestra las asignaciones existentes, pero deshabilita selección y guardado. El backend también rechaza cambios mientras la solicitud de cambio esté abierta.

## Revisión de cambios de archivos en el detalle

Cuando el detalle del caso está en `INPUT_CHANGE_REVIEW`, la vista consulta la solicitud pendiente de ese caso y presenta el motivo, la fecha de envío y los archivos originales y propuestos. La revisión no depende de que el caso tenga investigadores asignados. Si no hay una solicitud visible para el coordinador, se informa que no hay una solicitud pendiente disponible.

La integración usa estos endpoints del coordinador:

| Operación | Endpoint | Resultado |
| --- | --- | --- |
| Buscar solicitudes pendientes | `GET /api/v1/operations/input-change-requests` | Lista `InputChangeRequestSummary`; la interfaz selecciona la solicitud cuyo `caseId` coincide con el detalle. |
| Consultar el contenido para revisar | `GET /api/v1/operations/input-change-requests/{requestId}` | Devuelve `InputChangeRequest`, con `reason`, `resumeCaseStatus`, `originalFiles` y `proposedFiles`. |
| Descargar un archivo | `POST /api/v1/operations/input-change-requests/{requestId}/files/{fileId}/download` | Devuelve `DownloadIntent` con URL temporal y vencimiento. El `fileId` debe pertenecer a uno de los dos conjuntos de la solicitud. |
| Aprobar | `POST /api/v1/operations/input-change-requests/{requestId}/approval` | Sin cuerpo; responde `204`. Activa la propuesta y restaura el estado indicado por `resumeCaseStatus`. |
| Rechazar | `POST /api/v1/operations/input-change-requests/{requestId}/rejection` | Envía `{ "reason": "..." }`; el motivo no puede estar en blanco y admite máximo 1000 caracteres. Responde `204`, conserva los archivos originales y restaura `resumeCaseStatus`. |

Todas estas operaciones requieren una cuenta habilitada con rol coordinador. El propietario de la solicitud no puede revisarla ni descargar sus archivos desde estas rutas. Las decisiones requieren que la solicitud siga en `PENDING_REVIEW` y el caso en `INPUT_CHANGE_REVIEW`; una solicitud ya decidida no puede procesarse de nuevo. El backend responde `403` por permisos, `404` si la solicitud o el archivo no existe o no pertenece a ella, y `409` si el estado ya no permite la operación. El rechazo inválido responde `400`.

La interfaz muestra carga y errores durante las descargas y decisiones. El rechazo exige un motivo. Tras una respuesta exitosa de aprobación o rechazo, vuelve a consultar `GET /api/v1/operations/cases/academic/{caseId}` para refrescar los archivos vigentes y el estado devuelto por el backend. Si la decisión se guardó pero falla esta consulta, se conserva la confirmación y se indica que hay que recargar el detalle.
