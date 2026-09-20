# Healthdocs Viewer — Frontend

Aplicación web de desarrollo para Healthdocs Viewer basada en el contrato OpenAPI canónico `openapi/openapi.yaml` (v0.2.1).

## Características

- **Autenticación local de desarrollo**:
  - Pantalla de inicio de sesión con botones de acceso rápido para los usuarios de prueba definidos en el contrato:
    - **Paciente**: `paciente@healthdocs.local` (`paciente123`)
    - **Estudiante**: `estudiante@healthdocs.local` (`estudiante123`)
    - **Profesor**: `profesor@healthdocs.local` (`profesor123`)
- **Gestión de JWT y Seguridad**:
  - Almacenamiento seguro del token de sesión en el navegador.
  - Inyección automática de cabecera `Authorization: Bearer <token>` en todas las llamadas API.
  - Protección de rutas privadas: redirección inmediata a `/login` si no hay token válido.
  - Manejo de respuestas `401 Unauthorized`: limpieza del token y redirección al login.
  - Manejo de respuestas `403 Forbidden`: banner visible con mensaje claro de *Permisos insuficientes* sin filtrar datos sensibles.
- **Vistas y Acciones por Rol**:
  - **Paciente**:
    - Crear caso (`POST /cases`)
    - Cargar archivos con URL prefirmada (`POST /cases/{caseId}/uploads` y `POST /files/{fileId}/complete`)
    - Listar sus casos (`GET /cases`)
    - Consultar y descargar resultado disponible (`GET /cases/{caseId}/result`)
  - **Estudiante**:
    - Ver casos asignados (`GET /internal/cases`)
    - Descargar archivos de entrada (`POST /internal/cases/{caseId}/files/{fileId}/download`)
    - Cargar resultado de análisis (`POST /internal/cases/{caseId}/result-uploads` y `POST /files/{fileId}/complete`)
  - **Profesor**:
    - Supervisar casos habilitados (`GET /internal/cases`)
    - Asignar casos a estudiantes (`POST /operations/cases/{caseId}/assignments`)
    - Publicar y marcar resultados como disponibles para el paciente (`POST /operations/results/{resultId}/availability`)
- **Modos de Ejecución**:
    - **Mock Dev**: Emulador en memoria para desarrollo y pruebas inmediatas sin requerir backend iniciado. Cubre el flujo principal, pero no sustituye la validación end-to-end contra el backend real.
  - **Backend API**: Conexión directa mediante proxy hacia `http://localhost:8080/api/v1`.

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# Compilar para producción (TypeScript + Vite)
npm run build

# Vista previa de la compilación de producción
npm run preview
```

## Flujo local de resultados

La guía reproducible del paso 8, incluidos casos de prueba, estados HTTP, expiración de URLs y limitaciones, está en [`../docs/paso-8-flujo-local.md`](../docs/paso-8-flujo-local.md). El mock se puede usar sin backend; para probar el contrato real, iniciar primero PostgreSQL y Spring Boot según `backend/README.md`.
