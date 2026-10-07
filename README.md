# Healthdocs Viewer — Frontend

Aplicación web de desarrollo para Healthdocs Viewer basada en el contrato OpenAPI canónico `openapi/openapi.yaml` (v0.2.1).

## Características

- **Autenticación local de desarrollo**:
  - Pantalla de inicio de sesión con botones de acceso rápido para los usuarios de prueba definidos en el contrato:
    - **Paciente**: `paciente@healthdocs.local` (`paciente123`)
    - **Investigador**: `estudiante@healthdocs.local` (`estudiante123`)
    - **Coordinador**: `profesor@healthdocs.local` (`profesor123`)
Los valores técnicos de rol son `patient`, `researcher`, `coordinator` y `admin`. Los correos y contraseñas locales mostrados arriba son identificadores de prueba heredados; no representan los nombres de rol.
- **Gestión de JWT y Seguridad**:
  - Manejo de sesión y access token delegado al proveedor configurado.
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
  - **Investigador**:
    - Ver casos asignados (`GET /internal/cases`)
    - Descargar archivos de entrada (`POST /internal/cases/{caseId}/files/{fileId}/download`)
    - Cargar resultado de análisis (`POST /internal/cases/{caseId}/result-uploads` y `POST /files/{fileId}/complete`)
  - **Coordinador**:
    - Supervisar casos habilitados (`GET /internal/cases`)
    - Asignar casos a investigadores (`POST /operations/cases/{caseId}/assignments`)
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
# Autenticación

El frontend concentra login, logout, lectura del access token y cambios de sesión en `src/services/authService.ts`. Los componentes y servicios de negocio no importan el SDK de Supabase. Para mantener el flujo local existente, `VITE_AUTH_PROVIDER=local` es el valor predeterminado. Para usar Supabase configure en el entorno de Vite:

```dotenv
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

El cliente mantiene y renueva la sesión de Supabase; `apiClient` obtiene el token vigente antes de cada petición al backend. El backend devuelve el perfil y los permisos de negocio. Por eso, una cuenta Supabase debe estar vinculada a un usuario de Healthdocs antes de poder usar la aplicación. No use la `service_role` key en el navegador.
