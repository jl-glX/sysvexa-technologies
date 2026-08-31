# Gestión de formularios

## Qué ocurre al enviar uno

1. El navegador obtiene la clave pública de Turnstile desde el Worker.
2. Turnstile genera una verificación para la persona visitante.
3. El formulario envía los datos y esa verificación a
   `/api/service-requests`.
4. El Worker comprueba el origen, valida los campos y verifica Turnstile.
5. Solo si todo es correcto, guarda la solicitud en D1 y confirma el envío.

El navegador nunca recibe la clave secreta de Turnstile ni acceso directo a la
base de datos.

## Ver solicitudes desde Cloudflare

1. Entrar en el panel de Cloudflare.
2. Abrir **Almacenamiento y bases de datos**.
3. Abrir **D1 Base de datos SQLite**.
4. Elegir **sysvexa-service-requests**.
5. Entrar en **Studio** y seleccionar `sysvexa_service_requests`.

Las solicitudes más recientes se identifican por `created_at`. Los campos
`name`, `email`, `phone`, `service` y `details` contienen el contacto. El campo
`status` permite llevar el seguimiento:

- `new`: pendiente de revisar;
- `contacted`: ya se ha respondido;
- `in_progress`: trabajo en curso;
- `closed`: solicitud terminada.

## Cambiar el estado

Desde la consola SQL de Studio se puede ejecutar, sustituyendo el identificador:

```sql
UPDATE sysvexa_service_requests
SET status = 'contacted'
WHERE id = '<REQUEST_ID>';
```

Para ver primero las pendientes:

```sql
SELECT id, created_at, name, email, phone, service, details
FROM sysvexa_service_requests
WHERE status = 'new'
ORDER BY created_at ASC;
```

## Protección y mantenimiento

- No se guardan tokens de Turnstile.
- El campo trampa para bots tampoco se guarda.
- El secreto de Turnstile vive únicamente en Cloudflare.
- Las migraciones de D1 se guardan en `cloudflare/forms/migrations`.
- Antes de compartir o exportar datos hay que revisar que contienen información
  personal de clientes.
