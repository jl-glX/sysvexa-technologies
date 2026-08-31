#!/bin/sh
set -eu

SOURCE_DIRECTORY=${1:-}
RELEASE_ID=${2:-}
RELEASES_DIRECTORY=/var/www/sysvexa/releases
CURRENT_LINK=/var/www/sysvexa/current

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
find "$TARGET_DIRECTORY" -type d -exec chmod 0755 {} \;
find "$TARGET_DIRECTORY" -type f -exec chmod 0644 {} \;
ln -s "$TARGET_DIRECTORY" "$CURRENT_LINK.next"
mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
echo "Release activa: $TARGET_DIRECTORY"
