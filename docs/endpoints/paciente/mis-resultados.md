# Contrato de respuesta: Mis resultados personales

La vista `/mis_resultados` forma parte del espacio personal común a `PATIENT`, `RESEARCHER`, `COORDINATOR` y `ADMIN`. Lista exclusivamente resultados publicados de casos cuyo propietario es el usuario autenticado. Los resultados de casos asignados pertenecen a las vistas operativas del investigador o coordinador y no deben mezclarse con los resultados personales.

El contrato HTTP canónico está en [`backend/openapi/openapi.yaml`](../../../../backend/openapi/openapi.yaml).

## Listado

```http
GET /api/v1/patient/results?q=torax&sort=availableAt,desc&page=0&size=10
Authorization: Bearer <token>
```

El prefijo `/patient` se conserva por compatibilidad histórica; el alcance se determina por la identidad autenticada y aplica a los cuatro roles. El cliente no envía un `userId` ni un `patientId`.

Parámetros contractuales:

- `q`: búsqueda opcional, hasta 200 caracteres.
- `sort`: campo y dirección, por defecto `availableAt,desc`.
- `publicationType`: filtro opcional `INITIAL` o `CORRECTED`.
- `page`: índice desde cero, por defecto `0`.
- `size`: entre `1` y `100`, por defecto `10`.

Solo se listan resultados `AVAILABLE`, vigentes y no eliminados de casos propios. Los resultados de casos asignados se consultan en las pantallas operativas, mediante sus endpoints internos.

La respuesta incluye `summary` (`availableCaseCount`, `latestPublishedAt`), `items` (`resultId`, `caseId`, `caseReferenceCode`, `studyName`, `fileName`, `fileExtension`, `contentType`, `availableAt`, `publicationType`) y paginación (`totalItems`, `page`, `size`). El esquema exacto es `PatientResults` en OpenAPI.

## Descarga

```http
GET /api/v1/cases/{caseId}/result
Authorization: Bearer <token>
```

Cualquier rol habilitado puede solicitar una URL temporal únicamente para un resultado disponible de un caso propio. El endpoint valida propiedad, estado del resultado, archivo asociado y existencia del objeto. No permite descargar resultados anteriores ni resultados eliminados.

## Estados y publicación

- Solo se lista la versión vigente en estado `AVAILABLE`.
- `INITIAL` y `CORRECTED` son tipos de publicación, no estados.
- `UPLOADED`, `CORRECTION_REQUIRED` y `DELETED` no se cuentan como descargables.
- Una corrección vuelve a estar disponible cuando coordinación publica la nueva versión.
- La vista personal ofrece descarga; no vista previa, edición ni acceso al historial de versiones.

Las vistas operativas de coordinación e investigación conservan sus propios contratos y alcance de asignación, documentados en [Resultados de docencia](../coordinador/resultados.md#estados-y-acciones) y [Resultados cargados](../investigador/resultados-cargados.md).

## Estado de implementación

Este documento y OpenAPI establecen el alcance para los cuatro roles. La implementación del endpoint aún autoriza únicamente a `PATIENT`; esa diferencia queda registrada para una actualización posterior del backend y no altera el alcance contractual.
