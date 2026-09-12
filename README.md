<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/brand/loomark-lockup-dark.png">
    <img src="apps/web/public/brand/loomark-lockup-light.png" alt="Loomark" width="320" height="104">
  </picture>
</p>

<p align="center">
  <b>A self-hosted bookmark manager that syncs with your browser.</b>
</p>

<p align="center">
  <a href="https://loomarkdemo.vercel.app/login">Try the live demo</a> &#124; <a href="https://github.com/carlos-dubon/loomark/releases">Releases</a>
</p>

- Themes
- Search your bookmarks with `Command+K`
- Browser extension for Chromium based browsers and Firefox
- Two-way sync with your browser's bookmarks bar
- Import from any browser or from [Linkwarden](https://linkwarden.app)
- Share collections
- Installable as a PWA

## Install

Docker

```bash
mkdir loomark && cd loomark
curl -O https://raw.githubusercontent.com/carlos-dubon/loomark/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/carlos-dubon/loomark/main/.env.example
```

Set `AUTH_SECRET` and `AUTH_URL` in `.env`

```bash
docker compose up -d
```

## Extension

Sideload it from the [latest release](https://github.com/carlos-dubon/loomark/releases/latest).

**Chromium**: unzip `loomark-extension-<version>-chrome.zip`, then load the folder at `chrome://extensions` with developer mode on.

**Firefox**: load `loomark-extension-<version>-firefox.zip` at `about:debugging#/runtime/this-firefox` as a temporary add-on.

## Config

| Variable                                          |              |                                        |
| ------------------------------------------------- | ------------ | -------------------------------------- |
| `AUTH_SECRET`                                     | **required** | Session encryption key                 |
| `AUTH_URL`                                        | **required** | Public origin of your instance         |
| `LOOMARK_VERSION`                                 | optional     | Image tag to run, defaults to `latest` |
| `LOOMARK_SELF_UPDATE`                             | optional     | `false` turns off one click updates    |
| `DOCKER_SOCKET`                                   | optional     | Host path to the Docker socket         |
| `ALLOW_REGISTRATION`                              | optional     | `false` closes signups                 |
| `APP_PORT`                                        | optional     | Host port, defaults to `3000`          |
| `DB_WAIT_TIMEOUT`                                 | optional     | Seconds to wait for Postgres at boot   |
| `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` | optional     | Database credentials                   |

## Development

Node 24, pnpm, Docker.

```bash
git clone https://github.com/carlos-dubon/loomark.git && cd loomark
cp .env.example .env
pnpm install
docker compose up -d db
pnpm run db:migrate
pnpm run dev
```

## License

[MIT](LICENSE)
