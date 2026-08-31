#!/bin/sh
set -eu

CONFIG_FILE=${SYSVEXA_UPDATE_ENV_FILE:-/etc/sysvexa/update.env}
FAILED=0

pass() { printf 'OK  %s\n' "$1"; }
warn() { printf 'WARN %s\n' "$1" >&2; }
fail() { printf 'ERR %s\n' "$1" >&2; FAILED=1; }

version_at_least() {
  current_version=$1
  minimum_version=$2
  first_version=$(printf '%s\n' "$minimum_version" "$current_version" | sort -V | head -n 1)
  [ "$first_version" = "$minimum_version" ]
}

run_as_build_user() {
  home_dir=$(getent passwd "$SYSVEXA_BUILD_USER" | cut -d: -f6)
  runuser -u "$SYSVEXA_BUILD_USER" -- env HOME="$home_dir" "$@"
}

case "$(uname -s)" in
  Linux) pass "sistema Linux detectado" ;;
  *) fail "este despliegue requiere Linux" ;;
esac

for command_name in caddy curl git node npm runuser sort systemctl systemd-analyze; do
  if command -v "$command_name" >/dev/null 2>&1; then
    pass "$command_name disponible"
  else
    fail "$command_name no esta instalado"
  fi
done

if [ -r "$CONFIG_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
  pass "configuracion del actualizador disponible"
else
  fail "no se puede leer $CONFIG_FILE"
fi

: "${SYSVEXA_BUILD_USER:=sysvexa-updater}"
: "${SYSVEXA_CURRENT_LINK:=/var/www/sysvexa/current}"
: "${SYSVEXA_HEALTH_URL:=https://sysvexatechnologies.com/}"
: "${SYSVEXA_HEALTH_RESOLVE:=sysvexatechnologies.com:443:127.0.0.1}"

if id "$SYSVEXA_BUILD_USER" >/dev/null 2>&1; then
  pass "usuario de construccion $SYSVEXA_BUILD_USER disponible"
else
  fail "usuario de construccion $SYSVEXA_BUILD_USER inexistente"
fi

if id "$SYSVEXA_BUILD_USER" >/dev/null 2>&1 && command -v node >/dev/null 2>&1; then
  node_version=$(run_as_build_user node -p "process.versions.node")
  node_major=$(printf '%s' "$node_version" | cut -d. -f1)
  if [ "$node_major" = "24" ] && version_at_least "$node_version" "24.15.0"; then
    pass "Node.js $node_version compatible para $SYSVEXA_BUILD_USER"
  else
    fail "Node.js incompatible: $node_version; se requiere 24.15.0 o posterior dentro de la rama 24"
  fi
fi

if id "$SYSVEXA_BUILD_USER" >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  npm_version=$(run_as_build_user npm --version)
  npm_major=$(printf '%s' "$npm_version" | cut -d. -f1)
  if [ "$npm_major" = "12" ] && version_at_least "$npm_version" "12.0.2"; then
    pass "npm $npm_version compatible para $SYSVEXA_BUILD_USER"
  else
    fail "npm incompatible: $npm_version; se requiere 12.0.2 o posterior dentro de la rama 12"
  fi
fi

active_release=$(readlink -f "$SYSVEXA_CURRENT_LINK" 2>/dev/null || true)
if [ -n "$active_release" ] && [ -f "$active_release/index.html" ]; then
  pass "release web activa: $active_release"
else
  fail "current no apunta a una release con index.html"
fi

if command -v caddy >/dev/null 2>&1; then
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null; then
    pass "configuracion de Caddy valida"
  else
    fail "configuracion de Caddy no valida"
  fi
fi
if systemctl is-active --quiet caddy; then
  pass "servicio Caddy activo"
else
  fail "servicio Caddy inactivo"
fi

if command -v curl >/dev/null 2>&1 && curl --fail --silent --show-error --max-time 10 \
  --resolve "$SYSVEXA_HEALTH_RESOLVE" "$SYSVEXA_HEALTH_URL" >/dev/null; then
  pass "HTTPS local del origen saludable"
else
  fail "HTTPS local del origen no responde correctamente"
fi

if [ -f /etc/systemd/system/sysvexa-update.service ] && \
  [ -f /etc/systemd/system/sysvexa-update.timer ]; then
  if systemd-analyze verify /etc/systemd/system/sysvexa-update.service \
    /etc/systemd/system/sysvexa-update.timer; then
    pass "unidades del actualizador validas"
  else
    fail "unidades del actualizador no validas"
  fi
else
  warn "actualizador no instalado todavia"
fi

[ "$FAILED" -eq 0 ] || exit 1
printf 'Servidor preparado para el despliegue seguro de Sysvexa.\n'
