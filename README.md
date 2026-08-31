<p align="center">
  <img src="public/brand/loomark-rounded-512.png" alt="Loomark" width="112" height="112">
</p>

# Loomark

A self hosted bookmark manager: pinned websites on the homepage, full text search, a nested collections tree, and Chrome compatible import/export.

## Install

You need Docker and a machine to leave it running on. Nothing else — the image is prebuilt, so there is no repo to clone and no build step.

```bash
mkdir loomark && cd loomark
curl -O https://raw.githubusercontent.com/carlos-dubon/loomark/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/carlos-dubon/loomark/main/.env.example
```

Open `.env` and set `AUTH_SECRET` to a random value:

```bash
openssl rand -base64 32
```

If you will reach Loomark at anything other than `http://localhost:3000`, set `AUTH_URL` to that origin too. Then start it:

```bash
docker compose up -d
```

Loomark is on http://localhost:3000. The first account you create becomes the owner — create it, then set `ALLOW_REGISTRATION=false` in `.env` and run `docker compose up -d` again to close sign ups.

## Install as an app

Loomark is a PWA, so it installs to the dock, the home screen, and the app switcher with no store involved.

| Platform              | How                                                                               |
| --------------------- | --------------------------------------------------------------------------------- |
| macOS, Windows, Linux | Chrome or Edge: the install button in the address bar. Safari: File → Add to Dock |
| iPhone, iPad          | Share → Add to Home Screen                                                        |
| Android               | Chrome menu → Install app                                                         |

Installing needs a secure context — `https://` or `http://localhost`. On a plain `http://` LAN address no browser will offer it, so put Loomark behind TLS (Caddy, Traefik, nginx, Tailscale) and point `AUTH_URL` at that origin.

Pages are always fetched from the server, since they carry your library. An installed Loomark is not an offline copy of it — when the server is unreachable you get a small offline screen instead.

## Browser extension

There is a companion extension in [`extension/`](extension) that saves the page you are on straight into a collection, and shows a check when the page is already in your library.

It is not in any store yet, so you sideload it. Every release ships a prebuilt zip — grab `loomark-extension-<version>-chrome.zip` from the [latest release](https://github.com/carlos-dubon/loomark/releases/latest), unzip it, and load the folder as an unpacked extension. [`extension/README.md`](extension/README.md) has the per browser steps, and how to build it yourself instead.

It signs in with your Loomark email and password, exchanges them for an API token, and talks to the same API the web app uses. Nothing else on your instance changes: the extension has no host access until you name your server in the popup, and the API keeps rejecting cross origin requests from ordinary websites.

## Upgrade

New releases are published to GitHub Container Registry. Upgrading is a pull and a restart, from any version to any later version:

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically when the container starts, in order, so a box sitting on `0.0.1` catches up to the newest release in one step. Nothing to run by hand.

There is a script that takes a database backup first, which is the safer habit:

```bash
curl -O https://raw.githubusercontent.com/carlos-dubon/loomark/main/scripts/upgrade.sh
chmod +x upgrade.sh
./upgrade.sh
```

It writes a timestamped dump to `backups/` and then does the pull and restart.

By default you track `latest`. To pin a version instead, set `LOOMARK_VERSION` in `.env`:

```
LOOMARK_VERSION="0.2.5"
```

The version you are running is shown in Settings, and at `GET /api/health`.

### Rolling back

Set `LOOMARK_VERSION` to the older release and run `docker compose up -d`. Note that migrations are not reversible — if the newer version migrated your database, restore the dump you took before upgrading:

```bash
gunzip -c backups/loomark-<timestamp>.sql.gz | docker compose exec -T db psql -U loomark -d loomark
```

## Development

Requires Node 24, pnpm, and Docker.

```bash
git clone https://github.com/carlos-dubon/loomark.git && cd loomark
cp .env.example .env
pnpm install
docker compose up -d db
pnpm run db:migrate
pnpm run dev
```

The extension is a workspace package, so `pnpm install` at the root installs it too. `pnpm run ext:dev` runs it against a browser with hot reload.

To build and run the image locally instead of pulling it:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

### Releasing

One command:

```bash
pnpm version 0.2.5
```

That runs typecheck and lint on both the app and the extension, builds the extension, bumps `package.json`, commits, tags `v0.2.5`, and pushes the tag. CI takes it from there: it builds `linux/amd64` and `linux/arm64` natively, pushes to `ghcr.io/carlos-dubon/loomark` as `0.2.5`, `0.2`, and `latest`, zips the Chrome and Firefox extension builds, and opens a GitHub release with generated notes and those zips attached.

`patch`, `minor`, and `major` work in place of an explicit number. The checks run before the tag exists, so a failing typecheck stops the release rather than shipping it. Your working tree must be clean.

The extension takes its manifest version from the root `package.json`, so it is always stamped with the release it shipped in — there is no second version to bump.

To build the image locally before tagging:

```bash
pnpm run docker:build
```

To produce the release zips locally:

```bash
pnpm run ext:zip && pnpm run ext:zip:firefox
```

### Brand assets

Every icon comes from one path definition in [`scripts/generate-brand-assets.mjs`](scripts/generate-brand-assets.mjs). Edit the geometry there, then:

```bash
pnpm run brand:generate
```

| Asset                                       | Path                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Mark, SVG, inherits `currentColor`          | `public/brand/loomark-mark.svg`                                          |
| Flat PNG, transparent                       | `public/brand/loomark-flat-{256,512,1024}.png`                           |
| Flat PNG, transparent, for dark backgrounds | `public/brand/loomark-flat-1024-light.png`                               |
| Flat PNG on the gradient tile               | `public/brand/loomark-gradient-{512,1024}.png`                           |
| Rounded PNG on the gradient tile            | `public/brand/loomark-rounded-{512,1024}.png`                            |
| Favicons                                    | `app/icon.svg`, `app/favicon.ico`                                        |
| Apple touch icon                            | `app/apple-icon.png`                                                     |
| PWA icons                                   | `public/icons/icon-{192,512}.png`, `public/icons/maskable-{192,512}.png` |

The output is committed; CI does not regenerate it.

### Schema changes

`pnpm run db:migrate` creates a migration from your schema edits. Commit the generated folder in `prisma/migrations` — that file is what lets every self hosted instance catch up on its next start. Prefer additive migrations; a column drop takes data with it on machines you cannot see.

## Import and export

Settings holds both sides of the Netscape bookmark file format, the HTML file every
major browser reads and writes.

**Import** takes a file exported from Chrome, Edge, Safari, Firefox, or anything else
speaking that format. Folders become collections, nesting is preserved, and links
already in your library are counted as duplicates rather than saved twice — so
re-importing the same file is a no-op. Root level links land in Unsorted, empty
folders are skipped, and non `http(s)` entries such as bookmarklets are reported as
skipped.

**Export** writes your whole library back out to the same format, so it doubles as a
backup and as a way into any browser. Pinned state rides along in a custom attribute
that other browsers ignore, which keeps a Loomark export → Loomark import round trip
lossless.

## Environment

| Variable                                          | Required           | Purpose                                              |
| ------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| `AUTH_SECRET`                                     | yes                | Session encryption key                               |
| `AUTH_URL`                                        | yes                | Public origin of the instance                        |
| `LOOMARK_VERSION`                                 | no                 | Image tag to run, defaults to `latest`               |
| `ALLOW_REGISTRATION`                              | no                 | `false` blocks sign ups once an account exists       |
| `APP_PORT`                                        | no                 | Host port, defaults to `3000`                        |
| `POSTGRES_USER` `POSTGRES_PASSWORD` `POSTGRES_DB` | no                 | Database credentials                                 |
| `DATABASE_URL`                                    | yes outside Docker | PostgreSQL connection string, set for you by Compose |

## Stack

Next.js 16 (App Router + Route Handlers) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui on Base UI · Jotai · Zod 4 · Auth.js (NextAuth) · Prisma 7 · PostgreSQL

## Scripts

| Script                    | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `pnpm run dev`            | Development server                           |
| `pnpm run build`          | Generate the Prisma client and build         |
| `pnpm run start`          | Production server                            |
| `pnpm run lint`           | ESLint                                       |
| `pnpm run typecheck`      | TypeScript                                   |
| `pnpm run db:migrate`     | Create and apply a migration                 |
| `pnpm run db:deploy`      | Apply pending migrations                     |
| `pnpm run db:studio`      | Prisma Studio                                |
| `pnpm run brand:generate` | Regenerate every logo, favicon, and PWA icon |
| `pnpm run docker:build`   | Build the production image locally           |
| `pnpm version <ver>`      | Check, bump, tag, and push a release         |

## API

All routes require a session cookie except `POST /api/register` and `GET /api/health`.

| Method                 | Route                    | Purpose                                                                            |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `POST`                 | `/api/register`          | Create an account                                                                  |
| `GET` `POST`           | `/api/bookmarks`         | List (`q`, `collectionId`, `tag`, `pinned`, `unsorted`, `take`, `skip`) and create |
| `DELETE`               | `/api/bookmarks`         | Delete many by `ids`                                                               |
| `POST`                 | `/api/bookmarks/restore` | Put deleted bookmarks back, ids and dates intact                                   |
| `GET` `PATCH` `DELETE` | `/api/bookmarks/[id]`    | Read, update, delete                                                               |
| `GET` `POST`           | `/api/collections`       | List and create                                                                    |
| `PATCH` `DELETE`       | `/api/collections/[id]`  | Update and delete                                                                  |
| `GET`                  | `/api/tags`              | List tags                                                                          |
| `GET`                  | `/api/metadata?url=`     | Title, description, favicon and preview image for a URL                            |
| `GET` `PATCH`          | `/api/appearance`        | Read and update the theme preset and view mode                                     |
| `GET`                  | `/api/health`            | Liveness, database check, and running version                                      |

## Shortcuts

| Key             | Action                               |
| --------------- | ------------------------------------ |
| `/`             | Focus search                         |
| `⌘B` / `Ctrl+B` | Toggle the sidebar                   |
| `D`             | Toggle dark mode                     |
| `Esc`           | Clear the current bookmark selection |
