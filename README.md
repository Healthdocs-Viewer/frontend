# Healthdocs Viewer — Frontend

Healthdocs Viewer es una aplicación web para seguir casos de estudio, gestionar sus archivos y entregar resultados. Este repositorio contiene la interfaz para pacientes, investigadores y coordinadores. El proyecto está en desarrollo; la aplicación permite recorrer los flujos principales con datos de demostración y conectar parte de ellos al backend.

## Avance funcional

| Espacio | Lo que se puede recorrer hoy |
| --- | --- |
| Paciente | Inicio con resumen y actividad reciente; creación y reanudación de casos; consentimiento, carga y envío de archivos; búsqueda y seguimiento de casos; consulta de resultados; notificaciones y solicitudes de cambio de archivos. |
| Investigador | Inicio con casos y resultados recientes; consulta de casos asignados y sus archivos; carga de resultados; seguimiento de resultados enviados y correcciones solicitadas. |
| Coordinador | Inicio con indicadores de trabajo; bandeja de casos académicos; gestión del acceso de investigadores; revisión de solicitudes de cambio; revisión, publicación y devolución de resultados para corrección. |

La navegación exige iniciar sesión y limita las pantallas según el rol. La interfaz contempla estados de carga, errores y respuestas de acceso denegado. También incluye vistas de ayuda y configuración; algunas acciones de configuración siguen siendo de muestra.

### Estado de la integración

- **Demostración local:** funciona sin iniciar el backend. El inicio de sesión ofrece accesos rápidos para los tres roles y utiliza datos de ejemplo. Sirve para revisar pantallas, navegación y estados de los flujos.
- **Conexión al backend:** los servicios de casos, archivos, resultados, asignaciones y notificaciones incluyen llamadas a la API. La integración completa de cada recorrido debe validarse con el backend y datos reales.
- **Pendiente:** la bandeja de resultados del paciente y el dashboard de coordinación todavía muestran datos de ejemplo. En modo demostración, el detalle del caso del paciente utiliza una ficha de ejemplo y permite simular la decisión de coordinación sobre un cambio de archivos. La revisión real de esa solicitud requiere el backend. El panel de administración está en preparación.

Estos puntos describen el estado de la interfaz; no representan una liberación para uso clínico o productivo.

## Recorrido sugerido para una demostración

1. Entrar como **paciente** para mostrar el dashboard, crear o retomar un caso, revisar sus archivos y abrir una solicitud de cambio.
2. Entrar como **investigador** para revisar casos asignados, abrir un detalle y seguir el flujo de entrega de resultados.
3. Entrar como **coordinador** para mostrar la bandeja académica, la gestión de investigadores y la revisión de resultados.

Los botones de acceso rápido aparecen en la pantalla de inicio de sesión cuando se usa la autenticación local. Los datos y credenciales de ese modo son exclusivamente de desarrollo.

## Ejecutar la demostración local

Requiere Node.js y npm. Desde la carpeta de este repositorio:

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`. Con la configuración predeterminada, la aplicación usa autenticación local y API simulada; no hace falta iniciar otros servicios.

Para usar el backend local, iniciarlo en `http://localhost:8080` y ejecutar en la consola del navegador:

```js
localStorage.setItem("healthdocs_use_mock_api", "false");
location.reload();
```

El servidor de desarrollo redirige `/api/v1` al backend local. Después de cambiar de modo, iniciar sesión de nuevo con una cuenta válida para ese entorno. Para volver a la demostración, cambiar el valor a `"true"`, recargar e iniciar sesión con uno de los accesos rápidos.

## Autenticación y herramientas de desarrollo

La autenticación local es la opción predeterminada. También se puede configurar Supabase Auth con las variables documentadas en [`.env.example`](.env.example). En ese caso, la cuenta debe estar vinculada a un usuario de Healthdocs en el backend para obtener su perfil y permisos.

```bash
npm run build    # Comprobación TypeScript y compilación con Vite
npm test -- --run # Pruebas con Vitest
npm run preview  # Vista previa de la compilación
```

El [índice de documentación](docs/README.md) reúne las especificaciones de diseño, los flujos por rol y los contratos de datos. El contrato OpenAPI y las instrucciones para iniciar el servidor están en el [repositorio del backend](https://github.com/Healthdocs-Viewer/backend).
