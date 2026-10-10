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
