#!/bin/sh
set -e

fail() {
  echo "loomark: $1" >&2
  exit 1
}

DOCKER_SOCKET=${DOCKER_SOCKET:-/var/run/docker.sock}

grant_socket_access() {
  [ -S "$DOCKER_SOCKET" ] || return 0

  gid=$(stat -c %g "$DOCKER_SOCKET" 2>/dev/null) || return 0
  group=$(awk -F: -v gid="$gid" '$3 == gid { print $1; exit }' /etc/group)

  if [ -z "$group" ]; then
    group=dockersock
    addgroup -g "$gid" "$group" 2>/dev/null || return 0
  fi

  addgroup loomark "$group" 2>/dev/null || true
  echo "loomark: Docker socket found, one click updates are available"
}

run() {
  if [ "$(id -u)" = 0 ]; then
    su-exec loomark "$@"
  else
    "$@"
  fi
}

if [ "$(id -u)" = 0 ]; then
  grant_socket_access
fi

[ -n "$DATABASE_URL" ] || fail "DATABASE_URL is not set"
[ -n "$AUTH_SECRET" ] || fail "AUTH_SECRET is not set"

DB_WAIT_TIMEOUT=${DB_WAIT_TIMEOUT:-180}
delay=1
deadline=$(($(date +%s) + DB_WAIT_TIMEOUT))

echo "loomark ${APP_VERSION:-dev}: applying database migrations"

while true; do
  if output=$(run pnpm --filter loomark db:deploy 2>&1); then
    printf '%s\n' "$output"
    break
  fi

  printf '%s\n' "$output" >&2

  case $output in
    *P1001*|*P1002*|*ECONNREFUSED*|*EAI_AGAIN*|*ENOTFOUND*|*"system is starting up"*) ;;
    *) fail "database migrations failed" ;;
  esac

  [ "$(date +%s)" -lt "$deadline" ] || fail "database unreachable after ${DB_WAIT_TIMEOUT}s"

  echo "loomark: database not ready, retrying in ${delay}s"
  sleep "$delay"
  delay=$((delay * 2))
  [ "$delay" -le 15 ] || delay=15
done

if [ "$(id -u)" = 0 ]; then
  exec su-exec loomark "$@"
fi

exec "$@"
