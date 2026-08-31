# Seguridad de Sysvexa Technologies

## Origen del perfil

Sysvexa reutiliza el perfil operativo mantenido en Umbravia Forge y lo adapta a
sus dos superficies reales: una web estática servida por Caddy y el Worker de
formularios. No se trasladan módulos de cuentas, sesiones, MFA o permisos que
Sysvexa todavía no tiene.

## Perímetro del servidor

El perfil compartido aporta:

- rechazo temprano con `404` de sondas a archivos de entorno, repositorios,
  claves, copias, bases locales, paneles, WordPress, PHP y rutas de diagnóstico;
- rechazo de `CONNECT`, `TRACE` y `TRACK`;
- límite exterior de un MiB por petición, seguido por el límite más estricto de
  16 KiB del Worker para las solicitudes;
- registro JSON con rotación, diez archivos de 25 MiB y conservación operativa
  máxima de 30 días;
- cabeceras CSP, HSTS, `nosniff`, aislamiento de ventanas y denegación de marcos;
- validación de que el paquete público no contiene secretos, claves ni bases.

La configuración equivalente de Nginx se mantiene como alternativa Linux, pero
la instalación activa usa Caddy. El dominio principal puede permanecer en modo
Solo DNS: estas defensas residen en el servidor y no dependen del proxy de
Cloudflare.

## Formulario

El Worker valida método, ruta, origen, tipo y tamaño del contenido, campos,
consentimiento, campo trampa y token Turnstile antes de escribir en D1. El token
y la clave secreta nunca se almacenan junto a la solicitud.

La conservación y el borrado manual de solicitudes se describen en
[`FORMULARIOS.md`](./FORMULARIOS.md). No existe por ahora un borrado automático:
el plazo definitivo debe aprobarse antes de convertirlo en una tarea programada.
