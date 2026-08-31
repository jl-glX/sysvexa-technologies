# Arquitectura evolutiva

Sysvexa empieza como una web estática deliberadamente pequeña. La instancia de
Lightsail publica únicamente los archivos compilados mediante Caddy; no ejecuta
una API, una base de datos ni un proceso Node permanente.

## Publicación de la web

```text
Navegador -> Caddy en Lightsail -> release estatica actual
```

- Caddy termina HTTPS en el origen y sirve `/var/www/sysvexa/current`.
- Cada versión es inmutable y el enlace `current` permite activación y reversión.
- Nginx puede sustituir a Caddy sirviendo exactamente el mismo enlace.
- El formulario solo confirma el éxito después de que la API haya persistido la
  solicitud.
- Stripe está preparado y desactivado; no hay secretos en la web estática.

## Recepción de solicitudes

La API está implementada como un Cloudflare Worker independiente del servidor
Linux. La web principal no necesita el proxy general de Cloudflare: Caddy o
Nginx envían únicamente `/api/service-requests` al dominio administrado
`forms.sysvexatechnologies.com`. Turnstile sigue siendo un widget del navegador;
el Worker recibe su token, lo valida con Siteverify y solo después escribe en
Cloudflare D1:

```text
Navegador -> widget Turnstile -> token
    |
    +-> Caddy/Nginx -> forms.sysvexatechnologies.com -> Worker API -> Siteverify
             |
             +-> binding DB -> Cloudflare D1
             |
             +-> binding de correo -> aviso sin datos personales
             |
             +-> Stripe Checkout y webhook, cuando se autorice
```

La clave pública de Turnstile puede llegar al navegador. Su secreto queda en el
entorno del Worker y D1 solo es accesible mediante su binding. El navegador no
recibe credenciales privadas ni acceso directo a la base.

R2 se añadirá únicamente si las solicitudes admiten fotografías o informes. KV
o Durable Objects no forman parte de esta ampliación; se introducirán solo
cuando exista un requisito concreto que D1 no cubra. Si el volumen o las
integraciones futuras justifican PostgreSQL, la frontera del repositorio permite
sustituir D1 por PostgreSQL con Hyperdrive sin cambiar el contrato del formulario.

Referencias de diseño:

- [Introducción a Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Validación de Turnstile en el servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## Límites de responsabilidad

- Lightsail no almacena datos de clientes ni claves de Stripe.
- El Worker valida origen, entrada, consentimiento y Turnstile antes de escribir.
- D1 persiste las solicitudes y sus migraciones se versionan con el Worker.
- Los secretos de Stripe viven en el entorno del Worker.
- El webhook verifica la firma sobre el cuerpo original antes de escribir.
- Caddy y Nginx publican la web y actúan como paso transparente para la ruta del
  formulario; cambiar entre ambos no altera el contrato de la API ni D1.

El código permanece inactivo hasta sustituir los identificadores de ejemplo,
crear el secreto y desplegar el Worker según `cloudflare/forms/README.md`.
