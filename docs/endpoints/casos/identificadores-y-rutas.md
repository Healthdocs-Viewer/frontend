# Contrato de navegación: código visible del caso

## Necesidad de la interfaz

El usuario reconoce el caso por un código `CAS-...`. Ese código debe aparecer en las direcciones que puede copiar, compartir, abrir directamente o recargar:

- Paciente: `/mis_casos/{referenceCode}`.
- Investigador o coordinador con acceso: `/casos_academicos/{referenceCode}`.

La pantalla personal tiene una ruta adicional para retomar la creación de un caso incompleto: `/mis_casos/{caseId}/edit`. Esta ruta recibe el UUID técnico porque se usa desde las acciones «Continuar» del dashboard y «Mis casos». Los casos desde `FILES_RECEIVED` en adelante usan la ruta de detalle con `referenceCode`; `INPUT_CHANGE_DRAFT` retoma la propuesta desde el detalle y `INPUT_CHANGE_REVIEW` muestra el seguimiento de solo lectura.

En la ruta de detalle, el parámetro SPA representa `referenceCode`; por ejemplo, `/mis_casos/CAS-20260921-0042`. La ruta `/mis_casos/{caseId}/edit` es la excepción para retomar casos incompletos: recibe el UUID técnico y está destinada a la navegación interna desde dashboard o «Mis casos», no a enlaces compartibles.

Cada caso tiene dos identificadores con usos distintos:

| Campo | Uso |
| --- | --- |
| `referenceCode` | Código legible en tablas, notificaciones, búsquedas y URL del frontend. Debe ser único y permanecer estable una vez asignado. |
| `id` | UUID técnico del caso para operaciones del API y relaciones con archivos, resultados y asignaciones. |

Las respuestas de listado y las notificaciones que enlacen a un caso deben entregar ambos campos. El frontend no debe tratar `CAS-...` como UUID ni convertir el código a UUID mediante reglas locales.

## Resolución del detalle por `referenceCode`

El OpenAPI actual no define `GET /cases/by-reference/{referenceCode}`. Como solución vigente, la pantalla consulta `GET /api/v1/cases?size=100`, busca coincidencia exacta por `referenceCode` en la lista propia y usa el `id` correspondiente para consultar el detalle y sus archivos. Esta resolución funciona para el conjunto devuelto por esa página; no es una operación de lookup dedicada.

El endpoint dedicado propuesto para eliminar la dependencia del listado es:

```http
GET /api/v1/cases/by-reference/{referenceCode}
Authorization: Bearer <token>
```

Respuesta mínima propuesta (`200 OK`):

```json
{
  "id": "8f3c2d13-64b0-47f7-9f12-66e43b9ec3b0",
  "referenceCode": "CAS-20260921-0042"
}
```

El backend busca el código exacto y comprueba que el paciente sea dueño del caso o que el usuario interno tenga acceso autorizado. Si no hay sesión válida, responde `401`. Si el caso no existe o el usuario no puede acceder, responde `404` sin revelar si el código pertenece a otra persona. Esta consulta solo resuelve identidad; no entrega contenido clínico ni URL de archivo.

## Flujo del frontend

1. Desde un listado, construir el enlace al flujo de edición con `id` para casos incompletos. Para casos enviados o posteriores, construir el enlace de detalle con `referenceCode`; conservar `id` para operaciones del API.
2. Para retomar la edición, consultar `GET /api/v1/cases/{caseId}`. El contrato permite recuperar los INPUT confirmados con `GET /api/v1/cases/{caseId}/uploads`; la implementación actual restaura sus metadatos desde `sessionStorage` y aún no consume ese endpoint en la reanudación.
3. Al abrir o recargar el detalle con `referenceCode`, la implementación actual consulta `GET /api/v1/cases?size=100` y busca el código exacto; el lookup dedicado queda como mejora pendiente.
4. Usar el `id` resuelto en las consultas y acciones del API que requieren `{caseId}`. Mantener `referenceCode` en la ruta de detalle.

Por ejemplo, `/mis_casos/CAS-20260921-0042` se resuelve a un UUID; después, consultar el resultado con `GET /api/v1/cases/{caseId}/result` usando ese UUID. Lo mismo aplica al detalle académico antes de operar sobre archivos, resultados o asignaciones.

## Estado del contrato

La consulta dedicada por `referenceCode` sigue siendo una propuesta para OpenAPI y backend. La implementación actual usa el listado como se describe arriba. La ruta de reanudación por UUID es una excepción de navegación, no un cambio a los identificadores del API. Al incorporar el lookup dedicado, revisar que el código sea único incluso con creaciones concurrentes y que permanezca estable.
