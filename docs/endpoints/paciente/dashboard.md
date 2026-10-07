# Contrato de respuesta: dashboard del paciente

Documento de trabajo para definir la respuesta del backend que consume el dashboard del paciente (`/dashboard`). Esta propuesta sirve para acordar la forma de los datos antes de implementarlos; no sustituye el contrato OpenAPI canónico hasta que se incorpore allí.

## Índice

- [Dashboard del paciente](#dashboard-del-paciente)

---

## Dashboard del paciente

**Estado:** propuesta inicial, pendiente de alinear e incorporar al OpenAPI.

**Vista:** `/dashboard` para el rol paciente.

**Objetivo:** entregar en una respuesta los datos que necesita la pantalla de inicio: tarjetas de resumen, casos recientes, próximos pasos, actividad reciente y resultados disponibles.

### Endpoint propuesto

```http
GET /api/v1/patient/dashboard
Authorization: Bearer <token>
```

El backend debe determinar el paciente a partir de la identidad autenticada. El cliente no envía `patientId`.

### Respuesta propuesta

Los valores son ilustrativos. Las fechas usan ISO 8601 en UTC. Los identificadores de caso y demás recursos son UUID; `referenceCode` es el código legible que se muestra en la interfaz.

```json
{
  "summary": {
    "activeCases": 4,
    "inProgressCases": 2,
    "availableResults": 1,
    "notificationsRequiringAttention": 1
  },
  "recentCases": [
    {
      "id": "caso-uuid",
      "referenceCode": "CAS-20260921-0002",
      "studyName": "Radiografía de tórax",
      "status": "CREATED",
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
      "title": "Resultado publicado",
      "description": "El resultado del caso CAS-20260910-0005 ya está disponible.",
      "caseId": "caso-uuid-3",
      "caseReferenceCode": "CAS-20260910-0005",
      "occurredAt": "2026-09-20T20:17:00Z"
    },
    {
      "id": "actividad-uuid-2",
      "type": "FILE_UPLOADED",
      "title": "Archivo cargado",
      "description": "Has cargado un archivo para el caso CAS-20260918-0001.",
      "caseId": "caso-uuid-2",
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
| Tarjeta “Notificaciones” | `summary.notificationsRequiringAttention` |
| Tabla “Mis casos recientes” | `recentCases` (hasta cinco casos) |
| Lista “Próximos pasos” | `nextSteps` |
| Lista “Actividad reciente” | `recentActivity` |
| Sección “Resultados disponibles” | `availableResults` |

### Límites de respuesta requeridos para backend

- `recentCases`: devolver como máximo cinco casos recientes, ordenados del más nuevo al más antiguo. Esta lista no se pagina en el dashboard.
- `nextSteps`: devolver como máximo cinco pasos.
- `recentActivity`: devolver como máximo diez actividades, ordenadas por `occurredAt` de más reciente a más antigua. El frontend puede mostrar solo las cinco primeras.
- `availableResults`: devolver como máximo tres resultados disponibles.

### Enumeraciones iniciales

Son sugerencias de contrato; hay que coordinarlas con los enums existentes en OpenAPI antes de implementarlas.

```text
Case status:
CREATED
FILES_RECEIVED
ENABLED_FOR_PROCESSING
RESULT_UPLOADED
RESULT_AVAILABLE

Next step type:
ACCEPT_CONSENT
UPLOAD_FILE
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
FILE_UPLOADED
RESULT_PUBLISHED
CASE_STATUS_CHANGED
NOTIFICATION_SENT
DOCUMENT_RECEIVED
REMINDER_SENT
RESULT_VIEWED
PERSONAL_DATA_CONFIRMED
CASE_ARCHIVED
MEDICAL_ORDER_ADDED
```

El frontend traduce los códigos estables a etiquetas, descripciones e iconos visibles. Si se decide que los textos sean configurables desde backend, acordar explícitamente idioma y compatibilidad.

### Criterios y decisiones pendientes

1. **Casos activos y en proceso:** la tarjeta dice “Casos activos” y su detalle “Total de casos creados”. Acordar si cuenta todos los casos creados o excluye los finalizados; si cuenta todos, renombrar el campo a `totalCases` para que no contradiga “activo”. Definir también qué estados entran en `inProgressCases`. Los estados actuales son `CREATED`, `FILES_RECEIVED`, `ENABLED_FOR_PROCESSING`, `RESULT_UPLOADED` y `RESULT_AVAILABLE`.
2. **Notificaciones frente a tareas:** decidir si `notificationsRequiringAttention` cuenta notificaciones no leídas o acciones pendientes. Son conceptos distintos; si se necesitan ambos, exponer contadores separados.
3. **Acciones y rutas:** el frontend actual muestra botones para próximos pasos y casos recientes, pero no les asigna navegación ni callbacks. “Ver todos” apunta a `/mis_casos`, “Ver resultados” a `/mis_resultados` y “Ver actividad” a `/dashboard/actividad`; `AppRoutes` declara `/mis_casos` y `/mis_resultados`, y no declara una ruta de actividad. Mantener `action.type` y resolver rutas reales en frontend; no devolver `href` SPA desde backend.
4. **Resultados:** `summary.availableResults` y `availableResults` incluyen solo resultados vigentes en `AVAILABLE`. Un resultado `CORRECTION_REQUIRED` o `DELETED` no aparece ni se cuenta para el paciente. La única acción sobre el archivo es descargarlo mediante el endpoint protegido, que valida acceso y genera una URL temporal; no incluir vista previa ni enlaces permanentes en el dashboard.
5. **Actividad:** determinar qué eventos se persisten y por cuánto tiempo. La publicación de eventos de resultado existente no implica por sí sola una bandeja consultable de actividad o notificaciones.

### Estado actual del proyecto

- Existe `GET /api/v1/cases` para listar los casos del paciente autenticado; devuelve una lista sin paginación.
- Existe la consulta de resultado individual `GET /api/v1/cases/{caseId}/result`.
- No existe aún un endpoint agregado de dashboard ni endpoints de listado de actividad, próximos pasos, resultados disponibles o bandeja de notificaciones.
- Los datos visibles actualmente en la pantalla del dashboard incluyen datos de ejemplo.
