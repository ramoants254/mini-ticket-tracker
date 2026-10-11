# Mini Ticket Tracker

A minimal support-ticket tracker: a REST API, a PostgreSQL database, and a single-page React UI.
Built for the Lodwar Services take-home assignment.

- **Backend:** Node.js, Express 5, TypeScript, `pg` (plain SQL), Zod
- **Database:** PostgreSQL 16 (via Docker Compose)
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Tests:** Vitest + Supertest (integration tests against a real database)

## Prerequisites

- **Node.js 22.12 or newer** (an `.nvmrc` is included: `nvm use`)
- **Docker** with Docker Compose (only used for PostgreSQL)

## Setup and run

```bash
# 1. Start PostgreSQL (creates the `tickets` and `tickets_test` databases)
docker compose up -d
docker compose ps                     # wait until the db service shows "healthy"

# 2. Backend: install, configure, create the schema, run
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev                           # API on http://localhost:3000

# 3. Frontend (in a second terminal)
cd frontend
npm install
npm run dev                           # UI on http://localhost:5173
```

Open http://localhost:5173. Quick API check: `curl localhost:3000/health` should return `{"status":"ok","db":"up"}`.

If port 5432 is already used by a local Postgres, change the mapping in `docker-compose.yml` to
`"5433:5432"` and use port 5433 in `backend/.env`.

To stop: `docker compose down` (keeps data) or `docker compose down -v` (wipes data, and re-runs the init script on next start).

## Running the tests

```bash
docker compose up -d
cd backend
npm test
```

The 12 integration tests exercise the real API against a real PostgreSQL database (`tickets_test`), with no mocks.
They truncate the `tickets` table between tests, so the test setup **refuses to run unless the database name ends in `_test`**.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `POST` | `/tickets` | `201` + ticket | `400` validation |
| `GET` | `/tickets?status=&page=&limit=` | `200` `{ data, page, limit, total }` | `400` bad params |
| `GET` | `/tickets/stats` | `200` `{ open, in_progress, closed }` | none expected |
| `PATCH` | `/tickets/:id` | `200` + updated ticket | `400` invalid, `404` not found |

- **Ticket:** `{ id, title, description, status, priority, createdAt }`
  - `status`: `open` (default) | `in_progress` | `closed`
  - `priority`: `low` | `medium` (default) | `high`
- **`POST /tickets`** body: `title` (required, max 255), `description` (optional), `priority` (optional).
- **`GET /tickets`**: `page` defaults to 1, `limit` to 10 (max 100). Newest tickets first. `total` is the count matching the filter.
- **`PATCH /tickets/:id`** accepts only `status` and/or `priority`. Other fields and empty bodies are rejected.
- **`GET /tickets/stats`** always includes all three statuses, with `0` where there are no tickets.
- **Errors** always use one shape: `{ "error": { "message": "...", "details": [{ "path": "...", "message": "..." }] } }`.

```bash
curl -X POST localhost:3000/tickets -H 'Content-Type: application/json' \
  -d '{"title":"Printer broken","priority":"high"}'
curl "localhost:3000/tickets?status=open&page=1&limit=10"
curl -X PATCH localhost:3000/tickets/1 -H 'Content-Type: application/json' -d '{"status":"closed"}'
curl localhost:3000/tickets/stats
```

## Project structure

```
docker-compose.yml          PostgreSQL + init script (creates the test database)
backend/
  src/app.ts                Express app (exported separately from the server for tests)
  src/server.ts             Starts the HTTP server
  src/config.ts             Environment loading (picks the test DB when NODE_ENV=test)
  src/routes/tickets.ts     The four endpoints
  src/schemas/ticket.ts     Zod validation schemas
  src/db/tickets.ts         All SQL queries
  src/db/schema.sql         Tables, enums, index (idempotent)
  src/middleware/           Central error handler
  tests/                    Integration tests
frontend/
  src/App.tsx               Page state and data loading
  src/api.ts                Typed fetch wrapper
  src/components/           TicketList, TicketForm, StatusSelect, StatsBar, Badge
```

The frontend dev server proxies `/api/*` to `http://localhost:3000`, so the browser uses a single origin.
Set `VITE_API_URL` to point the UI at a different API.

## Decisions & Tradeoffs

I used plain SQL with `pg` and Zod instead of an ORM, because the surface is four queries and I wanted the SQL visible and easy to review. Status and priority are PostgreSQL enums, so the database rejects invalid values even if the API had a bug; the cost is that adding a value later needs an `ALTER TYPE` migration. The schema is a single idempotent `schema.sql` applied by a small script rather than a real migration tool, which is fine for one table but gives no versioning or rollback. Docker is used only for PostgreSQL, since that is the painful dependency to install; running the Node apps directly is faster to develop with and keeps the setup simple. Pagination is offset-based (`LIMIT/OFFSET`) for simplicity, with `id` as a tiebreaker so pages are stable; cursor pagination would scale better for very large tables. I kept the scope to the brief, so there is no authentication, no deletion, no search, and no rate limiting. The tests are integration tests against a real database, and I added a guard so they cannot run against the development database. On the frontend I fetch directly with `useEffect` and cancel stale requests; I skipped frontend tests and styling polish, and a library like TanStack Query would be the next step for caching and optimistic updates. With more time I would add CI (GitHub Actions running the tests), OpenAPI documentation, a proper migration tool, a Dockerfile for the whole stack, and structured logging.

### Assumptions

- `PATCH` only updates `status` and `priority`; the title and description are not editable, as the brief specifies.
- A new ticket defaults to `status: open` and `priority: medium`; the client cannot set the initial status.
- `limit` is capped at 100 to protect the API; invalid `status`, `page`, or `limit` values return `400` rather than being ignored.
- The API returns `createdAt` (camelCase) even though the column is `created_at`.
- Integer ids (`SERIAL`) are used because ids are not exposed as public identifiers.
