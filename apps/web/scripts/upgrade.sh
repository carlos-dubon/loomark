#!/bin/sh
set -e

if [ ! -f docker-compose.yml ]; then
  echo "loomark: run this from the directory holding docker-compose.yml" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_FILE="$BACKUP_DIR/loomark-$(date +%Y%m%d-%H%M%S).sql.gz"

mkdir -p "$BACKUP_DIR"

echo "loomark: backing up the database to $BACKUP_FILE"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "loomark: backup is empty, refusing to upgrade" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "loomark: pulling the new image"
docker compose pull app

echo "loomark: restarting"
docker compose up -d

echo "loomark: done, migrations ran on start"
