# Despliegue portable y actualizaciones seguras

La release de Sysvexa es exclusivamente el contenido de `dist/`. Se publica en
`/var/www/sysvexa/releases/<id>` y el enlace `/var/www/sysvexa/current`
selecciona la versión activa. Caddy y Nginx sirven el mismo enlace, por lo que
cambiar de servidor web no modifica ni recompila la aplicación.

La arquitectura del actualizador reutiliza las garantías operativas probadas en
Umbravia Forge y las adapta a una web estática. No incorpora su servicio Node,
base de datos, usuarios de aplicación, lógica multitenant ni comprobaciones de
datos que Sysvexa no necesita.

## Componentes versionados

- `Caddyfile`: implementación actual con HTTPS automático y fallback SPA.
- `nginx.conf`: alternativa equivalente sobre el mismo artefacto.
- `activate-release.sh`: primer despliegue o activación manual con salud local.
- `auto-update.sh`: construcción aislada y activación automática desde `main`.
- `install-updater.sh`: instalación conservadora de script y unidades systemd.
- `check-linux-readiness.sh`: diagnóstico del runtime, Caddy, release y HTTPS.
- `rollback-release.sh`: reversión manual con restauración si el destino falla.
- `disable-automatic-updates.sh`: retira solo el actualizador y conserva la web.

## Primer despliegue manual

En el repositorio ya sincronizado del servidor:

```sh
npm ci
npm run check
sudo sh deploy/activate-release.sh dist "$(git rev-parse HEAD)"
```

La activación escribe marcadores de commit e integridad, cambia `current` de
forma atómica y consulta el origen directamente por HTTPS en `127.0.0.1`. Esta
comprobación no depende de la resolución DNS del equipo desde el que se visita
la web. Si falla y había una release anterior, la restaura.

## Instalar el actualizador

La deploy key de solo lectura debe seguir disponible para el usuario Linux que
realiza la construcción mediante el alias SSH `github-sysvexa`. El instalador
no copia, lee ni modifica la clave privada. En la instancia actual ese usuario
es `ubuntu`; en otra distribución se indica el usuario equivalente.

```sh
sudo sh deploy/install-updater.sh --build-user ubuntu
sudoedit /etc/sysvexa/update.env
sudo systemctl start sysvexa-update.service
sudo systemctl status sysvexa-update.service --no-pager
sudo systemctl enable --now sysvexa-update.timer
systemctl list-timers sysvexa-update.timer
```

La primera ejecución se hace manualmente antes de habilitar el temporizador. El
intervalo predeterminado es de 15 minutos. Puede cambiarse con un override de
systemd sobre `OnUnitActiveSec`, sin editar el script versionado.

Las unidades no contienen rutas `/home/ubuntu`: `ProtectHome=read-only` permite
leer la configuración SSH del usuario seleccionado sin hacer escribible su
directorio personal. Se requiere una distribución Linux con systemd y las
utilidades GNU habituales; Ubuntu es una opción, no un requisito.

El actualizador:

1. adquiere un bloqueo exclusivo;
2. consulta únicamente la rama configurada;
3. rechaza regresiones o historias divergentes;
4. construye el commit en un `git worktree` aislado;
5. ejecuta portabilidad, tests, tipos, build y auditoría del despliegue;
6. prepara una release inmutable identificada por el SHA completo;
7. cambia `current` atómicamente;
8. comprueba el HTTPS local del origen;
9. restaura la anterior si la candidata no está saludable.

Una instalación heredada sin marcadores se admite una sola vez como rollback
inicial. A partir de ahí, todas las releases automáticas llevan los marcadores
`.sysvexa-release-commit` y `.sysvexa-release-complete`.

La validación local elimina primero envoltorios `.bat`, `.cmd` y `.ps1` de las
carpetas operativas. GitHub Actions ejecuta después el control estricto sin
limpieza previa, de modo que un archivo exclusivo de Windows versionado hace
fallar CI en lugar de quedar oculto.

Diagnóstico completo del servidor:

```sh
sudo sh deploy/check-linux-readiness.sh
```

## Reversión manual

Las releases no se editan. Para seleccionar una anterior:

```sh
sudo sh deploy/rollback-release.sh <sha-o-identificador>
```

Si el destino no responde por HTTPS, el script vuelve a seleccionar la release
que estaba activa antes de la operación.

## Retirar las actualizaciones automáticas

```sh
sudo sh deploy/disable-automatic-updates.sh
```

Se exige que no haya una ejecución ni un bloqueo activos. Solo se eliminan el
temporizador, las unidades, el comando instalado y el área aislada de trabajo.
La release activa, las releases históricas, Caddy y su configuración permanecen.

## Caddy y alternativa Nginx

Caddy solicita y renueva automáticamente certificados públicos. Los puertos TCP
80 y 443 deben estar abiertos en Lightsail. La configuración se valida con:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

`nginx.conf` reproduce la raíz, fallback SPA, caché y cabeceras. Antes de
activarlo hay que instalar certificados públicos válidos, validar `nginx -t`,
detener Caddy y arrancar Nginx. Cloudflare puede permanecer en Full (strict)
porque el certificado del origen continúa siendo válido.
