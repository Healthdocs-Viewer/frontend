# Contrato de datos: Configuración de cuenta

Documento de trabajo para la vista `/configuracion`. Aunque la interfaz está disponible dentro de la aplicación, este contrato describe los datos propios del usuario autenticado y puede compartirse entre roles. Incluye perfil, preferencias, cambio de contraseña y cierre de la sesión actual. No incluye sesiones activas ni cierre global de sesiones, según el alcance acordado.

## Qué muestra la interfaz

- Resumen del perfil: nombre, correo, rol y estado de cuenta.
- Información personal: nombre completo, correo, tipo de usuario y documento de identificación.
- Seguridad: cambio de contraseña; verificación en dos pasos y correo de recuperación aparecen como funciones futuras.
- Preferencias de comunicación: notificaciones por correo, recordatorios de resultados y alertas de seguridad.
- Acciones de la cuenta: cerrar sesión.

La pantalla contiene actualmente datos de demostración y botones/toggles aún no conectados a operaciones de backend. La sección de sesiones activas y la acción «Cerrar todas las sesiones» se omiten del contrato y no deben cargarse mediante el `GET` de configuración.

## Obtener la configuración

Ya existe `GET /api/v1/me`, que devuelve únicamente el perfil mínimo de autenticación. Para cargar la pantalla completa se propone ampliarlo o crear una ruta dedicada. Recomendación: mantener `/me` como identidad compacta usada por la app y agregar:

```http
GET /api/v1/me/settings
Authorization: Bearer <token>
```

### Respuesta propuesta

```json
{
  "profile": {
    "id": "user-uuid",
    "fullName": "María Fernanda Torres",
    "email": "maria.torres@example.com",
    "role": "paciente",
    "enabled": true,
    "identification": {
      "type": "CC",
      "numberMasked": "••••5678"
    }
  },
  "preferences": {
    "emailNotifications": true,
    "resultReminders": true,
    "securityAlerts": true
  }
}
```

No devolver contraseña, hash, secretos de recuperación, tokens, IPs ni sesiones activas. El usuario se determina siempre a partir del token; no aceptar un `userId` para consultar la configuración de otra persona. Si una persona no tiene documento registrado, devolver `identification: null`.

## Editar información personal

Para editar los datos mostrados en «Información personal», se propone reemplazar los campos editables con una operación autenticada:

```http
PATCH /api/v1/me/profile
Authorization: Bearer <token>
Content-Type: application/json
```

Solicitud propuesta:

```json
{
  "fullName": "María Fernanda Torres",
  "identification": {
    "type": "CC",
    "number": "12345678"
  }
}
```

Respuesta `200 OK`: perfil actualizado con el mismo esquema `profile` del `GET`, con el número de identificación enmascarado. Validar formato y unicidad del documento si aplica. No incluir `role`, `enabled` ni `id` en la solicitud: son atributos administrados por el sistema.

El correo debe tratarse aparte si se permite cambiarlo, con verificación del nuevo correo antes de hacerlo efectivo. No cambiarlo silenciosamente mediante el `PATCH` del perfil. El backend actual no tiene nombre, documento ni preferencias en su modelo de usuario, así que esos campos requieren persistencia y reglas antes de habilitar edición. Además, la configuración CORS actual solo permite `GET`, `POST`, `PUT` y `OPTIONS`; para usar `PATCH /me/profile` desde el frontend hay que agregar `PATCH` a los métodos permitidos o elegir un método ya habilitado.

## Actualizar preferencias

Las tres opciones de la interfaz pueden persistirse en un recurso separado:

```http
PUT /api/v1/me/preferences
Authorization: Bearer <token>
Content-Type: application/json
```

Solicitud propuesta (reemplaza todas las preferencias configurables):

```json
{
  "emailNotifications": true,
  "resultReminders": false,
  "securityAlerts": true
}
```

Respuesta `200 OK`:

```json
{
  "emailNotifications": true,
  "resultReminders": false,
  "securityAlerts": true,
  "updatedAt": "2026-10-05T15:20:00Z"
}
```

Los campos son preferencias, no una garantía de entrega. `resultReminders` controla correos de resultados; `emailNotifications` controla comunicaciones generales por correo; `securityAlerts` controla avisos de seguridad. Si luego se agregan preferencias por canal o tipo, se pueden expandir sin mezclar los ajustes con el perfil.

## Cambiar contraseña

La pantalla solicita «Contraseña actual» y «Nueva contraseña». Se propone:

```http
POST /api/v1/me/password
Authorization: Bearer <token>
Content-Type: application/json
```

Solicitud:

```json
{
  "currentPassword": "contraseña-actual",
  "newPassword": "nueva-contraseña-segura"
}
```

Respuesta exitosa: `204 No Content`. Si la contraseña actual no coincide, responder `400` o `422` con un error de negocio estable, sin revelar detalles que permitan adivinar credenciales. Validar longitud y política de contraseña en servidor; nunca devolver ni registrar contraseñas. Tras un cambio exitoso, definir si se conserva la sesión actual o se exige volver a iniciar sesión.

La autenticación puede delegarse a un proveedor externo (por ejemplo Cognito). La implementación debe usar el flujo de cambio de contraseña de ese proveedor y no actualizar directamente un hash local cuando la cuenta sea externa. El modelo actual autentica, pero no expone un caso de uso de cambio de contraseña.

## Cerrar sesión actual

La acción «Cerrar sesión» debe borrar el token local y limpiar el usuario en el estado de la aplicación, como hace actualmente `AuthContext.logout()`. Con tokens JWT stateless y sin refresh-token/revocación, basta con esta operación del frontend: no se necesita llamar a un endpoint para que el navegador deje de enviar el token.

Si se requiere invalidación inmediata del token en servidor, proponer además:

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

La respuesta sería `204 No Content`; el backend tendría que revocar el token o la sesión asociada. El backend actual no mantiene sesiones revocables, por lo que este endpoint no existe todavía y no debe presentarse como implementado. El cierre global de sesiones queda fuera de alcance.

## Endpoints actuales y propuestos

| Operación | Ruta | Estado |
| --- | --- | --- |
| Leer identidad mínima | `GET /api/v1/me` | Existe; devuelve `id`, `email`, `role`, `enabled`. No incluye perfil extendido ni preferencias. |
| Leer configuración | `GET /api/v1/me/settings` | Propuesta; omite intencionalmente sesiones activas. |
| Editar perfil | `PATCH /api/v1/me/profile` | Propuesta; requiere persistir nombre/documento. |
| Guardar preferencias | `PUT /api/v1/me/preferences` | Propuesta; requiere persistir preferencias. |
| Cambiar contraseña | `POST /api/v1/me/password` | Propuesta; requiere integración con el proveedor de autenticación. |
| Cerrar sesión | acción local `AuthContext.logout()`; opcional `POST /api/v1/auth/logout` | El cierre local existe en frontend. Ruta backend opcional, aún no implementada. |

## Fuera de alcance por ahora

- Listar o revocar sesiones activas. No incluir esta información en `GET /api/v1/me/settings`.
- Cerrar todas las sesiones o dispositivos.
- Verificación de dos factores y correo de recuperación; la interfaz las anuncia como futuras.
- Cambio de correo electrónico sin verificación.
