#!/bin/sh
set -eu

RELEASE_ID=${1:-}
RELEASES_DIRECTORY=${SYSVEXA_RELEASES_DIR:-/var/www/sysvexa/releases}
CURRENT_LINK=${SYSVEXA_CURRENT_LINK:-/var/www/sysvexa/current}
HEALTH_URL=${SYSVEXA_HEALTH_URL:-https://sysvexatechnologies.com/}
HEALTH_RESOLVE=${SYSVEXA_HEALTH_RESOLVE:-sysvexatechnologies.com:443:127.0.0.1}
NEXT_LINK=${CURRENT_LINK}.next

case "$RELEASE_ID" in
  ""|*[!A-Za-z0-9._-]*)
    printf 'Uso: %s <identificador-release>\n' "$0" >&2
    exit 1
    ;;
esac

[ "$(id -u)" -eq 0 ] || {
  printf 'ERR la reversion debe ejecutarse como root\n' >&2
  exit 1
}

target=$RELEASES_DIRECTORY/$RELEASE_ID
previous=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)
[ -n "$previous" ] && [ -f "$previous/index.html" ] || {
  printf 'ERR no hay una release activa verificable\n' >&2
  exit 1
}
[ -f "$target/index.html" ] || {
  printf 'ERR la release de destino no contiene index.html: %s\n' "$target" >&2
  exit 1
}

switch_release() {
  destination=$1
  rm -f -- "$NEXT_LINK"
  ln -s "$destination" "$NEXT_LINK"
  mv -Tf "$NEXT_LINK" "$CURRENT_LINK"
}

switch_release "$target"
if curl --fail --silent --show-error --max-time 10 \
  --resolve "$HEALTH_RESOLVE" "$HEALTH_URL" >/dev/null; then
  printf 'Release restaurada y saludable: %s\n' "$target"
  exit 0
fi

printf 'ERR la release elegida no esta saludable; se restaura %s\n' "$previous" >&2
switch_release "$previous"
curl --fail --silent --show-error --max-time 10 \
  --resolve "$HEALTH_RESOLVE" "$HEALTH_URL" >/dev/null || {
    printf 'ERR la release anterior tampoco supera la comprobacion local\n' >&2
    exit 1
  }
exit 1
