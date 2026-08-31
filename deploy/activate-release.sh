#!/bin/sh
set -eu

SOURCE_DIRECTORY=${1:-}
RELEASE_ID=${2:-}
RELEASES_DIRECTORY=/var/www/sysvexa/releases
CURRENT_LINK=/var/www/sysvexa/current
HEALTH_URL=${SYSVEXA_HEALTH_URL:-https://sysvexatechnologies.com/}
HEALTH_RESOLVE=${SYSVEXA_HEALTH_RESOLVE:-sysvexatechnologies.com:443:127.0.0.1}
NEXT_LINK=$CURRENT_LINK.next

case "$RELEASE_ID" in
  ""|*[!A-Za-z0-9._-]*)
    echo "El identificador de release no es valido" >&2
    exit 1
    ;;
esac
if [ ! -f "$SOURCE_DIRECTORY/index.html" ]; then
  echo "La release no contiene index.html" >&2
  exit 1
fi

TARGET_DIRECTORY=$RELEASES_DIRECTORY/$RELEASE_ID
if [ -e "$TARGET_DIRECTORY" ]; then
  echo "La release ya existe: $TARGET_DIRECTORY" >&2
  exit 1
fi

install -d -m 0755 "$RELEASES_DIRECTORY"
install -d -m 0755 "$TARGET_DIRECTORY"
cp -a "$SOURCE_DIRECTORY/." "$TARGET_DIRECTORY/"
printf '%s\n' "$RELEASE_ID" >"$TARGET_DIRECTORY/.sysvexa-release-commit"
printf '%s\n' "$RELEASE_ID" >"$TARGET_DIRECTORY/.sysvexa-release-complete"
find "$TARGET_DIRECTORY" -type d -exec chmod 0755 {} \;
find "$TARGET_DIRECTORY" -type f -exec chmod 0644 {} \;

PREVIOUS_TARGET=$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)
rm -f -- "$NEXT_LINK"
ln -s "$TARGET_DIRECTORY" "$NEXT_LINK"
mv -Tf "$NEXT_LINK" "$CURRENT_LINK"

if curl --fail --silent --show-error --max-time 10 \
  --resolve "$HEALTH_RESOLVE" "$HEALTH_URL" >/dev/null; then
  echo "Release activa y saludable: $TARGET_DIRECTORY"
  exit 0
fi

echo "La release no supera la comprobacion HTTPS local" >&2
if [ -n "$PREVIOUS_TARGET" ] && [ -f "$PREVIOUS_TARGET/index.html" ]; then
  ln -s "$PREVIOUS_TARGET" "$NEXT_LINK"
  mv -Tf "$NEXT_LINK" "$CURRENT_LINK"
  echo "Release anterior restaurada: $PREVIOUS_TARGET" >&2
else
  rm -f -- "$CURRENT_LINK"
  echo "No habia una release anterior que restaurar" >&2
fi
exit 1
