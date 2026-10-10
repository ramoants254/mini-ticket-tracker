-- Tickets schema. Idempotent: safe to run multiple times.

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)    NOT NULL,
  description TEXT,
  status      ticket_status   NOT NULL DEFAULT 'open',
  priority    ticket_priority NOT NULL DEFAULT 'medium',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Serves the main list query: filter by status, newest first.
CREATE INDEX IF NOT EXISTS idx_tickets_status_created
  ON tickets (status, created_at DESC);
