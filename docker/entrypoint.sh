#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "tana: DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "tana: AUTH_SECRET is not set" >&2
  exit 1
fi

echo "tana: applying database migrations"
npx --no-install prisma migrate deploy

exec "$@"
