#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "loomark: DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "loomark: AUTH_SECRET is not set" >&2
  exit 1
fi

echo "loomark ${APP_VERSION:-dev}: applying database migrations"
node_modules/.bin/prisma migrate deploy

exec "$@"
