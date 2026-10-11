import { Router } from "express";
import { createTicket, getStats, listTickets, updateTicket } from "../db/tickets";
import { HttpError } from "../middleware/errorHandler";
import { createTicketSchema, idParamSchema, listQuerySchema, updateTicketSchema } from "../schemas/ticket";

export const ticketsRouter = Router();

// POST /tickets: create a ticket
ticketsRouter.post("/", async (req, res) => {
  const input = createTicketSchema.parse(req.body ?? {});
  const ticket = await createTicket(input);
  res.status(201).json(ticket);
});

// GET /tickets?status=&page=&limit=: list tickets (filter + pagination)
ticketsRouter.get("/", async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  res.json(await listTickets(query));
});

// GET /tickets/stats: ticket counts grouped by status.
// NOTE: keep this registered BEFORE any "/:id" route. Today only PATCH uses
// "/:id", so there is no clash, but a future GET /tickets/:id declared first
// would swallow "stats" as an id.
ticketsRouter.get("/stats", async (_req, res) => {
  res.json(await getStats());
});

// PATCH /tickets/:id: update status and/or priority
ticketsRouter.patch("/:id", async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTicketSchema.parse(req.body ?? {});
  const ticket = await updateTicket(id, input);
  if (!ticket) throw new HttpError(404, `Ticket ${id} not found`);
  res.json(ticket);
});
