#!/bin/sh
set -eu

CONFIG_FILE=${SYSVEXA_UPDATE_ENV_FILE:-/etc/sysvexa/update.env}

if [ ! -r "$CONFIG_FILE" ]; then
  printf 'ERR no se puede leer la configuracion de actualizacion: %s\n' "$CONFIG_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
. "$CONFIG_FILE"

: "${SYSVEXA_REPOSITORY_URL:=git@github-sysvexa:jl-glX/sysvexa-technologies.git}"
: "${SYSVEXA_UPDATE_BRANCH:=main}"
: "${SYSVEXA_UPDATER_ROOT:=/var/lib/sysvexa-updater}"
: "${SYSVEXA_SOURCE_DIR:=$SYSVEXA_UPDATER_ROOT/source}"
: "${SYSVEXA_NPM_CACHE:=$SYSVEXA_UPDATER_ROOT/npm-cache}"
: "${SYSVEXA_BUILD_USER:=sysvexa-updater}"
: "${SYSVEXA_RELEASES_DIR:=/var/www/sysvexa/releases}"
: "${SYSVEXA_CURRENT_LINK:=/var/www/sysvexa/current}"
: "${SYSVEXA_HEALTH_URL:=https://sysvexatechnologies.com/}"
: "${SYSVEXA_HEALTH_RESOLVE:=sysvexatechnologies.com:443:127.0.0.1}"
: "${SYSVEXA_HEALTH_ATTEMPTS:=5}"
: "${SYSVEXA_HEALTH_DELAY_SECONDS:=2}"
: "${SYSVEXA_UPDATE_LOCK:=/run/lock/sysvexa-update.lock}"

log() {
  printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$1"
}

fail() {
  log "ERR $1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "falta el comando requerido: $1"
}

version_at_least() {
  current_version=$1
  minimum_version=$2
  first_version=$(printf '%s\n' "$minimum_version" "$current_version" | sort -V | head -n 1)
  [ "$first_version" = "$minimum_version" ]
}

run_as_build_user() {
  home_dir=$(getent passwd "$SYSVEXA_BUILD_USER" | cut -d: -f6)
  [ -n "$home_dir" ] || fail "el usuario $SYSVEXA_BUILD_USER no tiene directorio personal"
  runuser -u "$SYSVEXA_BUILD_USER" -- env \
    HOME="$home_dir" \
    XDG_CONFIG_HOME="$home_dir/.config" \
    npm_config_cache="$SYSVEXA_NPM_CACHE" \
    "$@"
}

switch_current_release() {
  target=$1
  rm -f -- "$next_link"
  ln -s "$target" "$next_link"
  mv -Tf "$next_link" "$SYSVEXA_CURRENT_LINK"
}

health_check() {
  attempts=$SYSVEXA_HEALTH_ATTEMPTS
  while [ "$attempts" -gt 0 ]; do
    if curl --fail --silent --show-error --max-time 10 \
      --resolve "$SYSVEXA_HEALTH_RESOLVE" "$SYSVEXA_HEALTH_URL" >/dev/null; then
      return 0
    fi
    attempts=$((attempts - 1))
    [ "$attempts" -gt 0 ] && sleep "$SYSVEXA_HEALTH_DELAY_SECONDS"
  done
  return 1
}

release_is_complete() {
  candidate=$1
  expected_commit=$2
  [ -f "$candidate/index.html" ] || return 1
  [ -f "$candidate/.sysvexa-release-complete" ] || return 1
  [ -r "$candidate/.sysvexa-release-commit" ] || return 1
  [ "$(sed -n '1p' "$candidate/.sysvexa-release-commit")" = "$expected_commit" ] || return 1
}

remove_incomplete_release() {
  candidate=$1
  reason=$2
  [ -d "$candidate" ] || return 0
  [ "$(dirname "$candidate")" = "$SYSVEXA_RELEASES_DIR" ] ||
    fail "se rechaza limpiar una ruta fuera de releases: $candidate"
  [ "$candidate" != "$current_target" ] ||
    fail "se rechaza limpiar la release activa: $candidate"
  log "limpiando release incompleta ($reason): $candidate"
  rm -rf -- "$candidate"
}

cleanup_stale_builds() {
  for stale_build in "$SYSVEXA_UPDATER_ROOT"/build-*; do
    [ -e "$stale_build" ] || continue
    [ "$(dirname "$stale_build")" = "$SYSVEXA_UPDATER_ROOT" ] ||
      fail "ruta temporal inesperada: $stale_build"
    log "limpiando compilacion temporal abandonada: $stale_build"
    run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" \
      worktree remove --force "$stale_build" >/dev/null 2>&1 || true
    rm -rf -- "$stale_build"
  done
  run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" worktree prune
}

[ "$(id -u)" -eq 0 ] || fail "el actualizador debe ejecutarse como root"

for command_name in basename chown cp cut curl dirname env find flock getent git head install ln mktemp mv node npm readlink rm runuser sed sh sort; do
  require_command "$command_name"
done

id "$SYSVEXA_BUILD_USER" >/dev/null 2>&1 ||
  fail "usuario de construccion inexistente: $SYSVEXA_BUILD_USER"
build_group=$(id -gn "$SYSVEXA_BUILD_USER")

case "$SYSVEXA_SOURCE_DIR" in
  "$SYSVEXA_UPDATER_ROOT"/*) ;;
  *) fail "la copia de Git debe estar dentro de $SYSVEXA_UPDATER_ROOT" ;;
esac
case "$SYSVEXA_NPM_CACHE" in
  "$SYSVEXA_UPDATER_ROOT"/*) ;;
  *) fail "la cache de npm debe estar dentro de $SYSVEXA_UPDATER_ROOT" ;;
esac

node_version=$(run_as_build_user node -p "process.versions.node")
node_major=$(printf '%s' "$node_version" | cut -d. -f1)
if [ "$node_major" != "24" ] || ! version_at_least "$node_version" "24.15.0"; then
  fail "Node.js incompatible: $node_version; se requiere 24.15.0 o posterior dentro de la rama 24"
fi

npm_version=$(run_as_build_user npm --version)
npm_major=$(printf '%s' "$npm_version" | cut -d. -f1)
if [ "$npm_major" != "12" ] || ! version_at_least "$npm_version" "12.0.2"; then
  fail "npm incompatible: $npm_version; se requiere 12.0.2 o posterior dentro de la rama 12"
fi

install -d -o root -g root -m 0755 "$(dirname "$SYSVEXA_UPDATE_LOCK")"
exec 9>"$SYSVEXA_UPDATE_LOCK"
if ! flock -n 9; then
  log "otra comprobacion de actualizaciones sigue activa; se omite esta ejecucion"
  exit 0
fi

install -d -o "$SYSVEXA_BUILD_USER" -g "$build_group" -m 0750 "$SYSVEXA_UPDATER_ROOT"
install -d -o "$SYSVEXA_BUILD_USER" -g "$build_group" -m 0700 "$SYSVEXA_NPM_CACHE"

if [ ! -d "$SYSVEXA_SOURCE_DIR/.git" ]; then
  log "creando la copia aislada de actualizacion"
  run_as_build_user git clone --branch "$SYSVEXA_UPDATE_BRANCH" --single-branch \
    "$SYSVEXA_REPOSITORY_URL" "$SYSVEXA_SOURCE_DIR"
fi

run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" fetch --prune origin "$SYSVEXA_UPDATE_BRANCH"
remote_commit=$(run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" rev-parse "origin/$SYSVEXA_UPDATE_BRANCH")

cleanup_stale_builds
next_link="${SYSVEXA_CURRENT_LINK}.next"
rm -f -- "$next_link"

current_target=""
current_ref=""
current_commit=""
if [ -L "$SYSVEXA_CURRENT_LINK" ]; then
  current_target=$(readlink -f "$SYSVEXA_CURRENT_LINK")
  [ "$(dirname "$current_target")" = "$SYSVEXA_RELEASES_DIR" ] ||
    fail "current apunta fuera del directorio de releases: $current_target"
  if [ -r "$current_target/.sysvexa-release-commit" ]; then
    current_ref=$(sed -n '1p' "$current_target/.sysvexa-release-commit")
  else
    current_ref=$(basename "$current_target")
  fi
  if run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" cat-file -e "$current_ref^{commit}" 2>/dev/null; then
    current_commit=$(run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" rev-parse "$current_ref^{commit}")
  else
    log "release activa heredada sin commit verificable; se conserva como rollback inicial"
  fi
fi

[ -n "$current_target" ] && [ -d "$current_target" ] ||
  fail "no existe una release activa anterior; realice primero un despliegue manual"

if [ "$current_commit" = "$remote_commit" ]; then
  log "sin cambios: $remote_commit ya esta desplegado"
  exit 0
fi

if [ -n "$current_commit" ] &&
  ! run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" merge-base --is-ancestor "$current_commit" "$remote_commit"; then
  fail "origin/$SYSVEXA_UPDATE_BRANCH no avanza desde la release activa; se rechaza una regresion"
fi

release_dir="$SYSVEXA_RELEASES_DIR/$remote_commit"
if [ -d "$release_dir" ]; then
  if release_is_complete "$release_dir" "$remote_commit"; then
    fail "la release completa ya existe y no esta activa; se conserva para revision: $release_dir"
  fi
  remove_incomplete_release "$release_dir" "resto de una ejecucion anterior"
fi

build_root=$(mktemp -d "$SYSVEXA_UPDATER_ROOT/build-${remote_commit}.XXXXXX")
case "$build_root" in
  "$SYSVEXA_UPDATER_ROOT"/build-*) ;;
  *) fail "ruta temporal inesperada: $build_root" ;;
esac
worktree_added=0
release_created=0
release_activated=0
release_preserved=0
cleanup() {
  if [ "$worktree_added" -eq 1 ]; then
    run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" \
      worktree remove --force "$build_root" >/dev/null 2>&1 || true
  fi
  if [ -d "$build_root" ]; then
    rm -rf -- "$build_root"
  fi
  if [ "$release_created" -eq 1 ] &&
    [ "$release_activated" -eq 0 ] &&
    [ "$release_preserved" -eq 0 ]; then
    remove_incomplete_release "$release_dir" "actualizacion no activada"
  fi
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
chown "$SYSVEXA_BUILD_USER:$build_group" "$build_root"

log "construyendo $remote_commit en un arbol aislado"
run_as_build_user git -C "$SYSVEXA_SOURCE_DIR" worktree add --detach "$build_root" "$remote_commit"
worktree_added=1
run_as_build_user sh -c '
  set -eu
  cd "$1"
  npm ci --audit=false --fund=false
  npm run check
' sh "$build_root"

install -d -o root -g root -m 0755 "$SYSVEXA_RELEASES_DIR"
install -d -o root -g root -m 0755 "$release_dir"
release_created=1
cp -a "$build_root/dist/." "$release_dir/"
printf '%s\n' "$remote_commit" >"$release_dir/.sysvexa-release-commit"
printf '%s\n' "$remote_commit" >"$release_dir/.sysvexa-release-complete"
chown -R root:root "$release_dir"
find "$release_dir" -type d -exec chmod 0755 {} \;
find "$release_dir" -type f -exec chmod 0644 {} \;
release_is_complete "$release_dir" "$remote_commit" || fail "la release preparada esta incompleta"

log "activando $remote_commit"
switch_current_release "$release_dir"
release_activated=1

if ! health_check; then
  log "ERR la candidata no supera la comprobacion HTTPS local; restaurando la release anterior" >&2
  release_preserved=1
  switch_current_release "$current_target"
  release_activated=0
  health_check || fail "la release anterior tampoco supera la comprobacion; se conservan ambas"
  fail "la candidata se ha conservado para revision y la release anterior vuelve a estar activa"
fi

log "release $remote_commit desplegada y saludable"
