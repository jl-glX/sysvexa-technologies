# Cifrado en tránsito

## Alcance

Sysvexa reutiliza el criterio de Umbravia Forge: el tráfico público se protege
con TLS moderno y no se añade una segunda capa AES privada sobre HTTPS. El
objetivo de este perfil se limita a dos recorridos:

1. envío del formulario desde el navegador hasta el Worker;
2. navegación desde Sysvexa hasta la página de pago alojada por Stripe.

No se cifra el enlace de Stripe porque no contiene datos personales ni datos de
tarjeta. Tampoco se entrega una clave AES al navegador: cualquier clave incluida
en el JavaScript público podría extraerse y no crearía una frontera de confianza.

## Formulario

```text
Navegador -- HTTPS/TLS --> Caddy -- HTTPS/TLS --> Cloudflare Worker
                                                   |
                                                   +--> Turnstile por HTTPS
                                                   +--> D1 mediante binding
```

- Caddy activa HTTPS automáticamente y mantiene los valores modernos de TLS:
  TLS 1.2 como mínimo y TLS 1.3 como máximo.
- TLS negocia una suite AEAD; AES-GCM puede ser elegida por los extremos y
  ChaCha20-Poly1305 permanece como alternativa interoperable.
- El frontend se niega a enviar el formulario desde un origen HTTP público. Se
  permite HTTP exclusivamente en `localhost`, `127.0.0.1` y `::1` para pruebas.
- El Worker vuelve a rechazar solicitudes HTTP públicas antes de leer el cuerpo.
- El salto Caddy-Worker usa `https://forms.sysvexatechnologies.com` y verifica
  normalmente el certificado del destino. No se permite omitir la validación.
- D1 usa un binding interno de Cloudflare; no se abre una conexión de base de
  datos desde el navegador ni desde el servidor Lightsail.

## Redirección a Stripe

La solicitud se guarda antes de iniciar el pago. Inmediatamente antes de
navegar, el frontend valida otra vez que el destino:

- usa `https://`;
- pertenece exactamente a `buy.stripe.com` o `book.stripe.com`;
- no contiene credenciales, puerto alternativo ni fragmento;
- conserva una ruta de pago no vacía.

Los destinos nacen de un catálogo local inmutable; el visitante no puede enviar
una URL arbitraria. La página alojada por Stripe recibe directamente los datos
de pago, por lo que los datos completos de tarjeta no atraviesan Sysvexa.

## Proxy alternativo

Nginx no es el servidor activo, pero su configuración equivalente declara TLS
1.2/1.3 tanto para clientes como para el salto al Worker y, de forma explícita,
verifica el certificado del upstream con el almacén de autoridades del sistema.

## Por qué no se añade AES-256-GCM de aplicación

AES-256-GCM sí es adecuado para contenido almacenado o para mensajes entre dos
extremos que comparten una clave secreta. En este recorrido uno de los extremos
es un navegador público. Guardar una clave simétrica en el frontend permitiría
que cualquier visitante la recuperase; introducir cifrado híbrido y rotación de
claves añadiría complejidad sin sustituir la autenticación del servidor que ya
proporciona TLS.

Por tanto, AES-GCM se usa cuando lo negocia TLS y no como sobre adicional de la
carga JSON. Esta decisión protege confidencialidad, integridad y autenticidad
del destino sin inventar un protocolo criptográfico propio.

## Referencias

- [Caddy TLS](https://caddyserver.com/docs/caddyfile/directives/tls)
- [Cloudflare Workers: prácticas recomendadas](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Cloudflare Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Guía de seguridad de Stripe](https://docs.stripe.com/security/guide)
