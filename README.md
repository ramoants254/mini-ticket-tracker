# Mini Ticket Tracker

A minimal support ticket tracker: REST API (Node/Express/TypeScript), PostgreSQL, and a React UI.

> Work in progress. Full setup instructions and "Decisions & Tradeoffs" will be added in the final phase.

## Prerequisites

- Docker (with Docker Compose)

## Database (Docker)

```bash
docker compose up -d      # start PostgreSQL
docker compose ps         # wait until the db service shows "healthy"
docker compose down       # stop (data is kept)
docker compose down -v    # stop AND wipe data (needed to re-run init scripts)
```

Two databases are created: `tickets` (development) and `tickets_test` (integration tests).

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev          # API on http://localhost:3000
curl localhost:3000/health   # {"status":"ok","db":"up"} when Postgres is running
```

Scripts: `dev` (watch mode), `build`, `start` (runs compiled output), `typecheck`, `db:migrate`, `db:migrate:test`, `test`.

### Database schema

```bash
npm run db:migrate         # apply schema to the dev DB (tickets)
npm run db:migrate:test    # apply schema to the test DB (tickets_test)
```

The schema (`backend/src/db/schema.sql`) is idempotent, so running it repeatedly is safe.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `POST` | `/tickets` | `201` + ticket | `400` validation |
| `GET` | `/tickets?status=&page=&limit=` | `200` `{ data, page, limit, total }` | `400` bad params |
| `GET` | `/tickets/stats` | `200` `{ open, in_progress, closed }` | none expected |
| `PATCH` | `/tickets/:id` | `200` + updated ticket | `400` invalid, `404` not found |

Notes: `page` defaults to 1 and `limit` to 10 (max 100); tickets are ordered newest first.
`PATCH` accepts only `status` and/or `priority`. All errors use one shape:
`{ "error": { "message": "...", "details": [{ "path": "...", "message": "..." }] } }`.

```bash
curl -X POST localhost:3000/tickets -H 'Content-Type: application/json' \
  -d '{"title":"Printer broken","priority":"high"}'
curl "localhost:3000/tickets?status=open&page=1&limit=10"
curl -X PATCH localhost:3000/tickets/1 -H 'Content-Type: application/json' -d '{"status":"closed"}'
curl localhost:3000/tickets/stats
```

## Tests

Integration tests (Vitest + Supertest) run against a real PostgreSQL database, never mocks.

```bash
docker compose up -d            # the tickets_test database is created automatically
cd backend
npm run db:migrate:test         # optional: the test setup also applies the schema itself
npm test
```

The tests use `TEST_DATABASE_URL` and refuse to run unless the database name ends in `_test`,
because they truncate the `tickets` table between tests.
