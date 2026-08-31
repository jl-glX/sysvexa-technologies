# Arquitectura evolutiva

Sysvexa empieza como una web estática deliberadamente pequeña. La instancia de
Lightsail publica únicamente los archivos compilados mediante Caddy; no ejecuta
una API, una base de datos ni un proceso Node permanente.

## Publicación de la web

```text
Navegador -> Cloudflare -> Caddy en Lightsail -> release estatica actual
```

- Caddy termina HTTPS en el origen y sirve `/var/www/sysvexa/current`.
- Cada versión es inmutable y el enlace `current` permite activación y reversión.
- Nginx puede sustituir a Caddy sirviendo exactamente el mismo enlace.
- El formulario solo confirma el éxito después de que la API haya persistido la
  solicitud.
- Stripe está preparado y desactivado; no hay secretos en la web estática.

## Recepción de solicitudes

La API está implementada como un Cloudflare Worker independiente del servidor
Linux. Turnstile sigue siendo un widget del navegador; el Worker recibe su token,
lo valida con Siteverify y solo después escribe en PostgreSQL externo mediante
Hyperdrive:

```text
Navegador -> widget Turnstile -> token
    |
    +-> Worker API -> Siteverify
             |
             +-> Hyperdrive -> PostgreSQL externo
             |
             +-> Stripe Checkout y webhook, cuando se autorice
```

La clave pública de Turnstile puede llegar al navegador. Su secreto queda en el
entorno del Worker y las credenciales de PostgreSQL quedan en Hyperdrive. El
navegador no recibe ninguna de esas credenciales privadas.

R2 se añadirá únicamente si las solicitudes admiten fotografías o informes. KV,
D1 o Durable Objects no forman parte de esta ampliación; se introducirán solo
cuando exista un requisito concreto que no cubra PostgreSQL.

Referencias de diseño:

- [Conectar PostgreSQL mediante Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/)
- [Validación de Turnstile en el servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## Límites de responsabilidad

- Lightsail no almacena datos de clientes ni claves de Stripe.
- El Worker valida origen, entrada, consentimiento y Turnstile antes de escribir.
- PostgreSQL persiste las solicitudes; el esquema se versiona con el Worker.
- Los secretos de Stripe viven en el entorno del Worker.
- El webhook verifica la firma sobre el cuerpo original antes de escribir.
- Caddy y Nginx solo publican la web; cambiar entre ambos no altera la API ni la
  base externa.

El código permanece inactivo hasta sustituir los identificadores de ejemplo,
crear el secreto y desplegar el Worker según `cloudflare/forms/README.md`.
