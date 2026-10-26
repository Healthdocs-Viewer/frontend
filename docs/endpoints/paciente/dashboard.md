# Contrato de respuesta: dashboard del paciente

Contrato del dashboard personal de `PATIENT`. Su forma canónica está en `backend/openapi/openapi.yaml` bajo `GET /patient/dashboard`. Este contrato no se extiende a otros roles.

## Índice

- [Dashboard del paciente](#dashboard-del-paciente)

---

## Dashboard del paciente

**Estado:** contrato vigente para el rol `PATIENT`.

**Vista:** `/dashboard` cuando el usuario autenticado tiene el rol paciente.

**Objetivo:** entregar en una respuesta los datos que necesita la pantalla de inicio: tarjetas de resumen, casos recientes, próximos pasos, actividad reciente y resultados disponibles.

### Endpoint vigente

```http
GET /api/v1/patient/dashboard
Authorization: Bearer <token>
```

El endpoint está reservado a cuentas `PATIENT` habilitadas. El backend determina la identidad desde el token; el cliente no envía `patientId`.

Los dashboards de `RESEARCHER`, `COORDINATOR` y `ADMIN` tendrán contratos y endpoints propios, protegidos por sus roles. Sus métricas, datos y rutas aún no están diseñados; no deben reutilizarse como autorización los permisos del dashboard de paciente.

### Respuesta

Los valores son ilustrativos. Las fechas usan ISO 8601 en UTC. Los identificadores de caso y demás recursos son UUID; `referenceCode` es el código legible que se muestra en la interfaz. `recentActivity` agrega en esta misma respuesta la actividad visible de todos los casos del paciente autenticado; el cliente no realiza una llamada por caso. La respuesta lleva solamente `id`, `type`, `occurredAt` y `caseReferenceCode`; la interfaz genera textos neutrales desde plantillas locales.

```json
{
  "summary": {
    "activeCases": 4,
    "inProgressCases": 2,
    "availableResults": 1
  },
  "recentCases": [
    {
      "id": "caso-uuid",
      "referenceCode": "CAS-20260921-0002",
      "studyName": "Radiografía de tórax",
      "status": "CONSENT_PENDING",
      "createdAt": "2026-09-20T20:45:00Z"
    },
    {
      "id": "caso-uuid-2",
      "referenceCode": "CAS-20260918-0001",
      "studyName": "Resonancia de rodilla",
      "status": "ENABLED_FOR_PROCESSING",
      "createdAt": "2026-09-18T16:20:00Z"
    }
  ],
  "nextSteps": [
    {
      "id": "paso-uuid-1",
      "caseId": "caso-uuid",
      "caseReferenceCode": "CAS-20260921-0002",
      "type": "ACCEPT_CONSENT",
      "title": "Completar consentimiento",
      "description": "Revisa y acepta los términos para continuar con el estudio.",
      "priority": "HIGH",
      "createdAt": "2026-09-20T20:45:00Z",
      "action": {
        "type": "ACCEPT_CONSENT",
        "label": "Completar"
      }
    },
    {
      "id": "paso-uuid-2",
      "caseId": "caso-uuid-2",
      "caseReferenceCode": "CAS-20260918-0001",
      "type": "UPLOAD_FILE",
      "title": "Cargar archivo pendiente",
      "description": "Adjunta las imágenes o documentos solicitados por tu centro médico.",
      "priority": "NORMAL",
      "createdAt": "2026-09-18T16:20:00Z",
      "action": {
        "type": "UPLOAD_FILE",
        "label": "Cargar"
      }
    }
  ],
  "recentActivity": [
    {
      "id": "actividad-uuid-1",
      "type": "RESULT_PUBLISHED",
      "caseReferenceCode": "CAS-20260910-0005",
      "occurredAt": "2026-09-20T20:17:00Z"
    },
    {
      "id": "actividad-uuid-2",
      "type": "FILE_RECEIVED",
      "caseReferenceCode": "CAS-20260918-0001",
      "occurredAt": "2026-09-18T16:23:00Z"
    }
  ],
  "availableResults": [
    {
      "id": "resultado-uuid",
      "caseId": "caso-uuid-3",
      "caseReferenceCode": "CAS-20260910-0005",
      "studyName": "TAC de abdomen",
      "availableAt": "2026-09-20T20:17:00Z"
    }
  ]
}
```

### Relación con los componentes

| Componente de la pantalla | Datos de la respuesta |
| --- | --- |
| Tarjeta “Casos activos” | `summary.activeCases` |
| Tarjeta “En proceso” | `summary.inProgressCases` |
| Tarjeta “Resultados disponibles” | `summary.availableResults` |
| Tarjeta “Notificaciones” | Fuera de este contrato hasta integrar el inbox en el paso 5. |
| Tabla “Mis casos recientes” | `recentCases` (hasta cinco casos) |
| Lista “Próximos pasos” | `nextSteps` |
| Lista “Actividad reciente” | `recentActivity` |
| Sección “Resultados disponibles” | `availableResults` |

### Límites de respuesta requeridos para backend

- `recentCases`: devolver como máximo cinco casos recientes, ordenados del más nuevo al más antiguo. Esta lista no se pagina en el dashboard.
- `nextSteps`: devolver como máximo cinco pasos.
- `recentActivity`: devolver como máximo cinco actividades agregadas de todos los casos propios, ordenadas por `occurredAt DESC, id DESC`. El backend filtra propiedad del caso, audiencia del tipo y vigencia del resultado antes del límite. Solo devuelve `CASE_CREATED`, `CONSENT_ACCEPTED`, `FILE_RECEIVED`, `CASE_PROCESSING_ENABLED`, `RESULT_PUBLISHED`, `INPUT_CHANGE_OPENED`, `INPUT_CHANGE_SUBMITTED`, `INPUT_CHANGE_APPROVED`, `INPUT_CHANGE_REJECTED` y `INPUT_CHANGE_CANCELLED`. Un `RESULT_PUBLISHED` solo aparece si el resultado sigue en `AVAILABLE` y no está eliminado. Excluye auditoría, notificaciones y telemetría técnica.
- `availableResults`: devolver como máximo tres resultados vigentes disponibles, cada uno una sola vez. Una publicación corregida reemplaza a la anterior; `summary.availableResults` cuenta los mismos resultados únicos.

### Enumeraciones del contrato

Estados de caso acordados con OpenAPI:

```text
Case status:
CONSENT_PENDING
FILE_PENDING
CONFIRMATION_PENDING
FILES_RECEIVED
ENABLED_FOR_PROCESSING
RESULT_UPLOADED
RESULT_AVAILABLE

Next step type:
ACCEPT_CONSENT
UPLOAD_FILE
CONFIRM_CASE
VIEW_RESULT
SIGN_AUTHORIZATION
SCHEDULE_FOLLOW_UP
DOWNLOAD_REPORT

Priority:
HIGH
NORMAL
LOW

Activity type:
CASE_CREATED
CONSENT_ACCEPTED
FILE_RECEIVED
CASE_PROCESSING_ENABLED
RESULT_PUBLISHED
INPUT_CHANGE_OPENED
INPUT_CHANGE_SUBMITTED
INPUT_CHANGE_APPROVED
INPUT_CHANGE_REJECTED
INPUT_CHANGE_CANCELLED
```

El frontend traduce los códigos estables a etiquetas, descripciones e iconos visibles. Si se decide que los textos sean configurables desde backend, acordar explícitamente idioma y compatibilidad.

### Criterios y decisiones pendientes

1. **Casos activos y en proceso:** la tarjeta dice “Casos activos” y su detalle “Total de casos creados”. Acordar si cuenta todos los casos creados o excluye los finalizados; si cuenta todos, renombrar el campo a `totalCases` para que no contradiga “activo”. El contador `inProgressCases` incluye `ENABLED_FOR_PROCESSING` y `RESULT_UPLOADED`; los estados de registro y `FILES_RECEIVED` son previos a la asignación.
2. **Notificaciones frente a tareas:** decidir si `notificationsRequiringAttention` cuenta notificaciones no leídas o acciones pendientes. Son conceptos distintos; si se necesitan ambos, exponer contadores separados.
3. **Acciones y rutas:** la actividad reciente enlaza al detalle existente `/mis_casos/{caseReferenceCode}`; la página resuelve la referencia al identificador interno antes de consultar el caso. No se devuelve un `href` ni un identificador interno de caso en cada actividad. “Ver todos” apunta a `/mis_casos` y “Ver resultados” a `/mis_resultados`.
4. **Resultados:** `summary.availableResults` y `availableResults` incluyen solo resultados propios vigentes en `AVAILABLE`. Un resultado `CORRECTION_REQUIRED` o `DELETED` no aparece ni se cuenta. La única acción sobre el archivo es descargarlo mediante el endpoint protegido, que valida propiedad y genera una URL temporal; no incluir vista previa ni enlaces permanentes en el dashboard.
5. **Actividad:** el dashboard incluye hasta cinco eventos persistidos visibles al paciente. La interfaz deriva títulos y descripciones neutrales de una lista fija por tipo; no usa motivos libres, nombres de archivos ni datos clínicos. La tarjeta muestra carga mientras llega el dashboard, un error si falla la consulta y un mensaje vacío cuando `recentActivity` no contiene eventos. La actividad sigue separada de la bandeja de notificaciones y de la telemetría técnica.

### Estado actual del proyecto

- Existe `GET /api/v1/cases` para listar únicamente los casos propios del usuario autenticado, independientemente de su rol; devuelve una respuesta paginada.
- Existe la consulta de resultado individual `GET /api/v1/cases/{caseId}/result`.
- Existe `GET /api/v1/patient/dashboard` exclusivamente para cuentas PATIENT; incluye hasta cinco actividades recientes de sus casos y no expone la bandeja de notificaciones.
- La consulta agregada y esta presentación aplican solo al dashboard `PATIENT`. Coordinación e investigación quedan fuera de esta entrega y requieren definir sus audiencias y presentaciones propias.

### Verificación de actividad reciente

- La prueba de consulta cubre agregación entre varios casos del mismo paciente, exclusión de casos de otra persona, filtro de tipos, ocultamiento de resultados que dejaron de estar publicados, orden por `occurredAt DESC, id DESC` y límite de cinco.
- La prueba de interfaz cubre carga, error, lista vacía, textos neutrales y navegación desde una actividad al caso por su referencia.
- Estas pruebas locales no sustituyen una verificación integral contra PostgreSQL. Las migraciones V33/V34 y la validación del despliegue permanecen pendientes independientes.
