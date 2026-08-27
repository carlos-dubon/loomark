# tana

棚 — *shelf*. A self hosted bookmark manager: pinned websites on the homepage, full text search, a nested collections tree, and Chrome compatible import/export.

## Import and export

Settings holds both sides of the Netscape bookmark file format, the HTML file every
major browser reads and writes.

**Import** takes a file exported from Chrome, Edge, Safari, Firefox, or anything else
speaking that format. Folders become collections, nesting is preserved, and links
already on your shelf are counted as duplicates rather than saved twice — so
re-importing the same file is a no-op. Root level links land in Unsorted, empty
folders are skipped, and non `http(s)` entries such as bookmarklets are reported as
skipped.

**Export** writes your whole shelf back out to the same format, so it doubles as a
backup and as a way into any browser. Pinned state rides along in a custom attribute
that other browsers ignore, which keeps a tana export → tana import round trip
lossless.

## Stack

Next.js 16 (App Router + Route Handlers) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui on Base UI · Jotai · Zod 4 · Auth.js (NextAuth) · Prisma 7 · PostgreSQL

## Run with Docker

```bash
cp .env.example .env
```

Set `AUTH_SECRET` in `.env` to a random value:

```bash
openssl rand -base64 32
```

Then start the stack:

```bash
docker compose up -d --build
```

The app is on http://localhost:3000. Migrations run automatically on every container start. The first account you create becomes the owner; set `ALLOW_REGISTRATION=false` afterwards to close sign ups.

## Run locally

Requires Node 24 and a PostgreSQL instance.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate the Prisma client and build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply pending migrations |
| `npm run db:studio` | Prisma Studio |

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Session encryption key |
| `AUTH_URL` | yes | Public origin of the instance |
| `ALLOW_REGISTRATION` | no | `false` blocks sign ups once an account exists |

## API

All routes require a session cookie except `POST /api/register` and `GET /api/health`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Create an account |
| `GET` `POST` | `/api/bookmarks` | List (`q`, `collectionId`, `tag`, `pinned`, `unsorted`, `take`, `skip`) and create |
| `GET` `PATCH` `DELETE` | `/api/bookmarks/[id]` | Read, update, delete |
| `GET` `POST` | `/api/collections` | List and create |
| `PATCH` `DELETE` | `/api/collections/[id]` | Update and delete |
| `GET` | `/api/tags` | List tags |
| `GET` | `/api/metadata?url=` | Title, description, favicon and preview image for a URL |
| `GET` | `/api/health` | Liveness and database check |

## Shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `⌘B` / `Ctrl+B` | Toggle the sidebar |
| `D` | Toggle dark mode |
