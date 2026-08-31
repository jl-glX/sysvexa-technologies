# Formularios de Sysvexa en Cloudflare

Este Worker adapta el flujo público de formularios y CAPTCHA de Umbravia Forge
sin importar su servidor, sus cuentas ni su base multiempresa. Cloudflare
intercepta `/api/service-requests`, valida Turnstile y persiste la solicitud en
Cloudflare D1 mediante un binding privado.

D1 evita administrar otro proveedor, credenciales y conexiones de red. El
esquema empieza con estados e índices versionados para permitir crecimiento
controlado. La capa `repository.ts` mantiene aislada la persistencia para poder
migrar en el futuro a PostgreSQL con Hyperdrive sin cambiar el formulario.

## Preparación

La infraestructura activa utiliza:

- base D1 `sysvexa-service-requests`;
- widget Turnstile `Sysvexa Technologies` para `sysvexatechnologies.com`;
- Worker `sysvexa-service-requests` en el dominio administrado
  `forms.sysvexatechnologies.com`.

La web principal puede permanecer en modo **Solo DNS**. Caddy y Nginx conservan
la URL pública `/api/service-requests`, pero envían únicamente esas peticiones
al dominio dedicado del Worker. Cloudflare crea y mantiene el registro DNS y el
certificado de ese subdominio.

## Preparar una cuenta nueva

1. Crear la base D1:

   ```sh
   npx wrangler d1 create sysvexa-service-requests
   ```

2. Sustituir `<D1_DATABASE_ID>` en `wrangler.jsonc` por el identificador devuelto
   y aplicar las migraciones versionadas:

   ```sh
   npx wrangler d1 migrations apply sysvexa-service-requests --remote --config cloudflare/forms/wrangler.jsonc
   ```

3. Crear un widget Turnstile para `sysvexatechnologies.com`, copiar su clave
   pública a `wrangler.jsonc` y guardar el secreto sin escribirlo en el
   repositorio:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY --config cloudflare/forms/wrangler.jsonc
   ```

   El valor se pega cuando Wrangler lo solicita de forma interactiva. No se
   añade a la propia línea del comando, a un archivo versionado ni al servidor
   Linux.

4. Regenerar tipos, validar y desplegar:

   ```sh
   npm run worker:types
   npm run worker:check
   npm run worker:deploy
   ```

El binding de D1 y el secreto de Turnstile quedan dentro de Cloudflare. El
navegador solo recibe la clave pública.
Las cabeceras CSP de Caddy, Nginx y del servidor Node permiten únicamente el
script y el marco de `https://challenges.cloudflare.com` que necesita el
widget.

## Gestionar las solicitudes

La forma más sencilla es abrir Cloudflare, entrar en **Almacenamiento y bases
de datos > D1 Base de datos SQLite > sysvexa-service-requests > Studio** y
seleccionar la tabla `sysvexa_service_requests`. Cada fila es una solicitud.

Los estados previstos son `new`, `contacted`, `in_progress` y `closed`. También
se pueden consultar o cambiar desde Wrangler:

```sh
# Últimas solicitudes
npx wrangler d1 execute sysvexa-service-requests --remote --config cloudflare/forms/wrangler.jsonc --command "SELECT id, created_at, name, email, phone, service, status FROM sysvexa_service_requests ORDER BY created_at DESC LIMIT 25"

# Marcar una solicitud como contactada
npx wrangler d1 execute sysvexa-service-requests --remote --config cloudflare/forms/wrangler.jsonc --command "UPDATE sysvexa_service_requests SET status = 'contacted' WHERE id = '<REQUEST_ID>'"
```

No se debe compartir una exportación de esta tabla sin revisar antes los datos
personales que contiene.
