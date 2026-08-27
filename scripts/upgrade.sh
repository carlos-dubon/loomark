#!/bin/sh
set -e

if [ ! -f docker-compose.yml ]; then
  echo "tana: run this from the directory holding docker-compose.yml" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
BACKUP_FILE="$BACKUP_DIR/tana-$(date +%Y%m%d-%H%M%S).sql.gz"

mkdir -p "$BACKUP_DIR"

echo "tana: backing up the database to $BACKUP_FILE"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "tana: backup is empty, refusing to upgrade" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

echo "tana: pulling the new image"
docker compose pull app

echo "tana: restarting"
docker compose up -d

echo "tana: done, migrations ran on start"
