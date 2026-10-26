# Documentación del frontend

El [README principal](../README.md) resume el avance del producto y explica cómo abrir la demostración. Esta carpeta reúne las referencias de diseño, flujos por rol, contratos de datos y registros históricos.

## Diseño y flujos

| Tema | Documentos |
| --- | --- |
| Diseño compartido | [Contrato visual de la interfaz](design/UI-DESIGN-CONTRACT.md) |
| Coordinación académica | [Pantallas](roles/coordinador/PROFESSOR-SCREEN-SPEC.md) · [Reglas de implementación](roles/coordinador/PROFESSOR-TEACHING-CONTRACT.md) |
| Investigación académica | [Pantallas](roles/investigador/STUDENT-SCREEN-SPEC.md) · [Reglas de implementación](roles/investigador/STUDENT-IMPLEMENTATION-CONTRACT.md) |

Los nombres `PROFESSOR` y `STUDENT` se conservan en estos archivos por su historial. En la interfaz y los contratos actuales, los roles se llaman **coordinador** e **investigador**.

## Datos y API

El [índice de contratos por pantalla](endpoints/README.md) explica cómo leer estos documentos. Cada archivo distingue el comportamiento existente de los cambios propuestos. El OpenAPI del backend es la referencia de las rutas y esquemas ya incorporados.

| Área | Documentos |
| --- | --- |
| Paciente | [Dashboard](endpoints/paciente/dashboard.md) · [Mis casos](endpoints/paciente/mis-casos.md) · [Mis resultados](endpoints/paciente/mis-resultados.md) |
| Investigador | [Casos asignados](endpoints/investigador/casos-asignados.md) · [Resultados cargados](endpoints/investigador/resultados-cargados.md) |
| Coordinador | [Casos académicos](endpoints/coordinador/casos-academicos.md) · [Investigadores](endpoints/coordinador/estudiantes.md) · [Resultados](endpoints/coordinador/resultados.md) |
| Compartido | [Identificadores y rutas de casos](endpoints/casos/identificadores-y-rutas.md) · [Notificaciones](endpoints/notificaciones/contrato.md) · [Configuración de cuenta](endpoints/cuenta/configuracion.md) |

## Registro histórico

Los archivos de [historial](history/) reflejan el estado de trabajo en la fecha indicada; pueden mencionar rutas, pruebas o decisiones que cambiaron después:

- [6 de octubre de 2026: conexión de vistas y respuestas de ejemplo](history/2026-10-06-ui.md).
- [7 de octubre de 2026: integración de autenticación](history/2026-10-07-auth.md).
- [7 de octubre de 2026: plan de pruebas de autenticación](history/2026-10-07-auth-plan.md).

El [prompt de implementación anterior](archive/UI-IMPLEMENTATION-AGENT-PROMPT.md) queda archivado como material de trabajo, no como guía vigente para evaluar el avance.
