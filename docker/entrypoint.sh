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

echo "tana ${APP_VERSION:-dev}: applying database migrations"
node_modules/.bin/prisma migrate deploy

exec "$@"
