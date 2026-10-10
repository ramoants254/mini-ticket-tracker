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
