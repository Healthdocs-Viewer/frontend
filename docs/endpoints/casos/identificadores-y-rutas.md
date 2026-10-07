# Contrato de navegación: código visible del caso

## Necesidad de la interfaz

El usuario reconoce el caso por un código `CAS-...`. Ese código debe aparecer en las direcciones que puede copiar, compartir, abrir directamente o recargar:

- Paciente: `/mis_casos/{referenceCode}`.
- Investigador o coordinador con acceso: `/casos_academicos/{referenceCode}`.

El parámetro de la ruta SPA se llama `referenceCode`. Un ejemplo de dirección es `/mis_casos/CAS-20260921-0042`.

Cada caso tiene dos identificadores con usos distintos:

| Campo | Uso |
| --- | --- |
| `referenceCode` | Código legible en tablas, notificaciones, búsquedas y URL del frontend. Debe ser único y permanecer estable una vez asignado. |
| `id` | UUID técnico del caso para operaciones del API y relaciones con archivos, resultados y asignaciones. |

Las respuestas de listado y las notificaciones que enlacen a un caso deben entregar ambos campos. El frontend no debe tratar `CAS-...` como UUID ni convertir el código a UUID mediante reglas locales.

## Contrato necesario para abrir un enlace directo

Al abrir o recargar una dirección, el frontend solo conoce `referenceCode`. Necesita resolverlo con una consulta autenticada:

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

1. Desde un listado, construir el enlace con `referenceCode`. Conservar `id` para operaciones que ya se pueden iniciar desde esa pantalla.
2. Al abrir o recargar el detalle, consultar `GET /api/v1/cases/by-reference/{referenceCode}`. Mostrar carga, caso no encontrado o falta de sesión según la respuesta.
3. Usar el `id` recibido en las consultas y acciones del API que requieren `{caseId}`. Mantener `referenceCode` en la barra de direcciones.

Por ejemplo, `/mis_casos/CAS-20260921-0042` se resuelve a un UUID; después, consultar el resultado con `GET /api/v1/cases/{caseId}/result` usando ese UUID. Lo mismo aplica al detalle académico antes de operar sobre archivos, resultados o asignaciones.

## Estado del contrato

Esta es la necesidad y propuesta de contrato para el frontend. La consulta por `referenceCode` aún debe incorporarse al OpenAPI e implementarse. Al reconciliar el backend, revisar que la generación del código garantice unicidad incluso con creaciones concurrentes y que el código no cambie después de emitirse.
