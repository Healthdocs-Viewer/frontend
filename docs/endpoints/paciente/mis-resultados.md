# Contrato de respuesta: Mis resultados del paciente

Contrato de la vista `/mis_resultados` del rol **paciente**. Hay **un archivo de resultado vigente por caso** y el paciente **solo puede descargarlo**. No se ofrece vista previa, visualización en la plataforma ni edición del resultado. Las publicaciones anteriores y los resultados `DELETED` se conservan para trazabilidad interna, pero no se listan ni descargan desde esta pantalla.

## Qué necesita la vista

- Buscar por código del caso, estudio o nombre del archivo vigente.
- Ordenar por fecha de publicación.
- Mostrar código del caso, estudio, archivo, tipo, fecha disponible y acción «Ver caso» o «Descargar».
- Resumir cuántos casos tienen un resultado descargable y la fecha de la última publicación.

La interfaz de demostración incluye los filtros «Publicado», «Actualizado» y «Corregido». Para este alcance, «Publicado» identifica la primera publicación y «Corregido» una nueva publicación posterior a una solicitud de corrección. «Actualizado» no tiene un flujo propio definido; no debe enviarse como valor del API ni mostrarse como funcional hasta acordar su significado.

## Endpoint propuesto para el listado

```http
GET /api/v1/patient/results?q=torax&sort=availableAt,desc
Authorization: Bearer <token>
```

El backend determina al paciente a partir del token. Solo devuelve resultados en estado `AVAILABLE` y únicamente el archivo vigente de cada caso. `UPLOADED`, `CORRECTION_REQUIRED` y `DELETED` no aparecen ni en filas ni en contadores. `q` y `sort` son opcionales. Este endpoint aún no existe; el backend actual permite consultar un caso a la vez con `GET /api/v1/cases/{caseId}/result`.

### Respuesta propuesta

```json
{
  "summary": {
    "availableCaseCount": 1,
    "latestPublishedAt": "2026-09-21T20:45:00Z"
  },
  "items": [
    {
      "resultId": "result-uuid",
      "caseId": "case-uuid",
      "caseReferenceCode": "CAS-20260921-0002",
      "studyName": "Radiografía de tórax",
      "fileName": "Informe_corregido.pdf",
      "contentType": "application/pdf",
      "availableAt": "2026-09-21T20:45:00Z",
      "publicationType": "CORRECTED"
    }
  ],
  "totalItems": 1
}
```

`publicationType` indica si el archivo vigente corresponde a la publicación `INITIAL` o a una publicación `CORRECTED`. No es un estado del resultado: ambos tipos están en `AVAILABLE`. Requiere registrar la relación con la publicación reemplazada. El backend actual no conserva ese historial; esta diferencia se resolverá al adaptar el backend al contrato.

La fila utiliza `caseReferenceCode` para mostrar el caso y para la dirección `/mis_casos/{caseReferenceCode}`; `caseId` (UUID) se conserva para las llamadas al API. Las fechas se transmiten en ISO 8601 UTC y se formatean en el frontend.

## Descarga y correcciones

- El listado entrega metadatos, nunca una URL permanente ni contenido clínico.
- La descarga se obtiene mediante la consulta protegida `GET /api/v1/cases/{caseId}/result`, que valida al paciente y entrega una URL temporal cuando el resultado está `AVAILABLE`.
- Al solicitar una corrección, el resultado pasa de `AVAILABLE` a `CORRECTION_REQUIRED` y deja de aparecer en el listado descargable. El paciente no puede solicitar nuevas URL hasta que se cargue el reemplazo y un coordinador lo publique de nuevo.
- El archivo corregido pasa por `UPLOADED` antes de volver a `AVAILABLE`. La pantalla del paciente muestra solo la versión vigente; no permite descargar publicaciones anteriores.
- Si coordinación marca un resultado `DELETED`, desaparece de la vista del paciente y su archivo deja de ser descargable. Coordinación e investigación conservan acceso a sus metadatos y al motivo de eliminación en sus propias vistas.
- Una URL temporal emitida antes de pedir la corrección puede seguir activa hasta su vencimiento. La política de vigencia o revocación debe definirse al implementar la retirada.

El flujo completo y el tratamiento de eliminación se documentan en [Resultados de docencia](../coordinador/resultados.md#estados-y-acciones).

## Estado actual y trabajo pendiente

- El backend implementa `UPLOADED` y `AVAILABLE`, un resultado y un archivo por caso. Aún debe adaptarse a `CORRECTION_REQUIRED`, `DELETED`, historial de publicaciones y listado de resultados del paciente. Los cuatro estados ya están definidos para la interfaz.
- `GET /api/v1/cases/{caseId}/result` ya ofrece una URL temporal para el resultado disponible. Hay que conectar y verificar la acción de descarga en el frontend.
- La vista actual usa datos locales. El filtro «Actualizado» y las filas que simulan varios archivos o entregas del mismo caso quedan fuera del alcance acordado.
- La ruta de detalle debe recibir `referenceCode` en la dirección y resolver el UUID para las operaciones API, según [la decisión de identificadores](../casos/identificadores-y-rutas.md).
