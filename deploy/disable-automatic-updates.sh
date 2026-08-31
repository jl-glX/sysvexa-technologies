#!/bin/sh
set -eu

UPDATER_ROOT=/var/lib/sysvexa-updater
UPDATE_LOCK=/run/lock/sysvexa-update.lock
UPDATE_SERVICE=/etc/systemd/system/sysvexa-update.service
UPDATE_TIMER=/etc/systemd/system/sysvexa-update.timer
UPDATER_COMMAND=/usr/local/sbin/sysvexa-update
CURRENT_RELEASE=/var/www/sysvexa/current

if [ "$(id -u)" -ne 0 ]; then
  printf 'ERR esta retirada debe ejecutarse como root\n' >&2
  exit 1
fi

case "$UPDATER_ROOT" in
  /var/lib/sysvexa-updater) ;;
  *)
    printf 'ERR ruta del actualizador inesperada: %s\n' "$UPDATER_ROOT" >&2
    exit 1
    ;;
esac

active_release=$(readlink -f "$CURRENT_RELEASE" 2>/dev/null || true)
if [ -z "$active_release" ] || [ ! -f "$active_release/index.html" ]; then
  printf 'ERR no se ha encontrado una release web activa; no se retira nada\n' >&2
  exit 1
fi

printf 'Release activa preservada: %s\n' "$active_release"
systemctl disable --now sysvexa-update.timer

if systemctl is-active --quiet sysvexa-update.timer; then
  printf 'ERR el temporizador sigue activo; no se limpia nada\n' >&2
  exit 1
fi
if systemctl is-active --quiet sysvexa-update.service; then
  printf 'ERR hay una actualizacion en curso; espere antes de retirarlo\n' >&2
  exit 1
fi

install -d -o root -g root -m 0755 "$(dirname "$UPDATE_LOCK")"
exec 9>"$UPDATE_LOCK"
if ! flock -n 9; then
  printf 'ERR el bloqueo del actualizador sigue ocupado\n' >&2
  exit 1
fi

rm -f -- "$UPDATE_SERVICE" "$UPDATE_TIMER" "$UPDATER_COMMAND"
if [ -d "$UPDATER_ROOT" ]; then
  rm -rf -- "$UPDATER_ROOT"
fi

systemctl daemon-reload
systemctl reset-failed sysvexa-update.service sysvexa-update.timer 2>/dev/null || true
printf 'Actualizador retirado. La web, Caddy y las releases permanecen intactos.\n'
