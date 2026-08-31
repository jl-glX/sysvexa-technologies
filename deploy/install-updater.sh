#!/bin/sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CONFIG_DIRECTORY=/etc/sysvexa
CONFIG_FILE=$CONFIG_DIRECTORY/update.env
UPDATER_COMMAND=/usr/local/sbin/sysvexa-update
SERVICE_FILE=/etc/systemd/system/sysvexa-update.service
TIMER_FILE=/etc/systemd/system/sysvexa-update.timer
ENABLE_TIMER=0
REQUESTED_BUILD_USER=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --build-user)
      [ "$#" -ge 2 ] || {
        printf 'ERR --build-user necesita un usuario\n' >&2
        exit 1
      }
      REQUESTED_BUILD_USER=$2
      shift 2
      ;;
    --enable)
      ENABLE_TIMER=1
      shift
      ;;
    *)
      printf 'Uso: %s --build-user <usuario-linux> [--enable]\n' "$0" >&2
      exit 1
      ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  printf 'ERR la instalacion debe ejecutarse como root\n' >&2
  exit 1
fi

for required_file in \
  "$PROJECT_ROOT/deploy/auto-update.sh" \
  "$PROJECT_ROOT/deploy/sysvexa-update.env.template" \
  "$PROJECT_ROOT/deploy/sysvexa-update.service" \
  "$PROJECT_ROOT/deploy/sysvexa-update.timer"; do
  [ -f "$required_file" ] || {
    printf 'ERR falta %s\n' "$required_file" >&2
    exit 1
  }
done

if [ -e "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
  BUILD_USER=${SYSVEXA_BUILD_USER:-}
  if [ -n "$REQUESTED_BUILD_USER" ] && [ "$REQUESTED_BUILD_USER" != "$BUILD_USER" ]; then
    printf 'ERR %s ya configura el usuario %s\n' "$CONFIG_FILE" "$BUILD_USER" >&2
    exit 1
  fi
else
  BUILD_USER=$REQUESTED_BUILD_USER
  if [ -z "$BUILD_USER" ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
    BUILD_USER=$SUDO_USER
  fi
fi

case "$BUILD_USER" in
  ""|root|*[!A-Za-z0-9._-]*)
    printf 'ERR indique un usuario Linux no root con --build-user\n' >&2
    exit 1
    ;;
esac
id "$BUILD_USER" >/dev/null 2>&1 || {
  printf 'ERR el usuario Linux no existe: %s\n' "$BUILD_USER" >&2
  exit 1
}
BUILD_GROUP=$(id -gn "$BUILD_USER")

install -d -o root -g root -m 0755 "$CONFIG_DIRECTORY"
install -m 0755 "$PROJECT_ROOT/deploy/auto-update.sh" "$UPDATER_COMMAND"
install -m 0644 "$PROJECT_ROOT/deploy/sysvexa-update.service" "$SERVICE_FILE"
install -m 0644 "$PROJECT_ROOT/deploy/sysvexa-update.timer" "$TIMER_FILE"

if [ ! -e "$CONFIG_FILE" ]; then
  install -o root -g root -m 0640 \
    "$PROJECT_ROOT/deploy/sysvexa-update.env.template" "$CONFIG_FILE"
  sed -i "s/^SYSVEXA_BUILD_USER=.*/SYSVEXA_BUILD_USER=$BUILD_USER/" "$CONFIG_FILE"
  printf 'Configuracion inicial creada para %s en %s\n' "$BUILD_USER" "$CONFIG_FILE"
else
  printf 'Configuracion existente preservada en %s\n' "$CONFIG_FILE"
fi

# El primer despliegue manual ya debe haber creado current. El instalador solo
# prepara rutas compartidas, nunca inventa una release inicial.
install -d -o root -g root -m 0755 /var/www/sysvexa/releases
install -d -o "$BUILD_USER" -g "$BUILD_GROUP" -m 0750 /var/lib/sysvexa-updater

systemd-analyze verify "$SERVICE_FILE" "$TIMER_FILE"
systemctl daemon-reload

if [ "$ENABLE_TIMER" -eq 1 ]; then
  systemctl enable --now sysvexa-update.timer
  printf 'Actualizador instalado y temporizador activado.\n'
else
  printf 'Actualizador instalado sin activar el temporizador.\n'
  printf 'Revise %s y ejecute primero: systemctl start sysvexa-update.service\n' "$CONFIG_FILE"
fi
