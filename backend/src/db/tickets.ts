import { pool } from "./pool";
import { TICKET_STATUSES } from "../schemas/ticket";
import type { CreateTicketInput, ListQuery, TicketPriority, TicketStatus, UpdateTicketInput } from "../schemas/ticket";

export interface Ticket {
  id: number;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
}

// Maps the snake_case column to the camelCase field used in the API.
const COLUMNS = `id, title, description, status, priority, created_at AS "createdAt"`;

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { rows } = await pool.query<Ticket>(
    `INSERT INTO tickets (title, description, priority)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNS}`,
    [input.title, input.description ?? null, input.priority],
  );
  return rows[0];
}

export interface TicketPage {
  data: Ticket[];
  page: number;
  limit: number;
  total: number;
}

export async function listTickets({ status, page, limit }: ListQuery): Promise<TicketPage> {
  const where = status ? "WHERE status = $1" : "";
  const filterParams = status ? [status] : [];

  // Newest first; `id DESC` is a tiebreaker so pages are stable when timestamps collide.
  const listSql = `SELECT ${COLUMNS} FROM tickets ${where}
                   ORDER BY created_at DESC, id DESC
                   LIMIT $${filterParams.length + 1} OFFSET $${filterParams.length + 2}`;
  const countSql = `SELECT COUNT(*)::int AS total FROM tickets ${where}`;

  const [list, count] = await Promise.all([
    pool.query<Ticket>(listSql, [...filterParams, limit, (page - 1) * limit]),
    pool.query<{ total: number }>(countSql, filterParams),
  ]);

  return { data: list.rows, page, limit, total: count.rows[0].total };
}

export type TicketStats = Record<TicketStatus, number>;

export async function getStats(): Promise<TicketStats> {
  const { rows } = await pool.query<{ status: TicketStatus; count: number }>(
    `SELECT status, COUNT(*)::int AS count FROM tickets GROUP BY status`,
  );

  // Start from zeros so statuses with no tickets are still present in the response.
  const stats = Object.fromEntries(TICKET_STATUSES.map((s) => [s, 0])) as TicketStats;
  for (const row of rows) stats[row.status] = row.count;
  return stats;
}

/** Returns the updated ticket, or null if no ticket has that id. */
export async function updateTicket(id: number, input: UpdateTicketInput): Promise<Ticket | null> {
  // COALESCE keeps the current value for any field the client didn't send.
  const { rows } = await pool.query<Ticket>(
    `UPDATE tickets
     SET status   = COALESCE($1::ticket_status, status),
         priority = COALESCE($2::ticket_priority, priority)
     WHERE id = $3
     RETURNING ${COLUMNS}`,
    [input.status ?? null, input.priority ?? null, id],
  );
  return rows[0] ?? null;
}
