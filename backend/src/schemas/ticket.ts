import { z } from "zod";

export const TICKET_STATUSES = ["open", "in_progress", "closed"] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;

export const statusSchema = z.enum(TICKET_STATUSES);
export const prioritySchema = z.enum(TICKET_PRIORITIES);

export type TicketStatus = z.infer<typeof statusSchema>;
export type TicketPriority = z.infer<typeof prioritySchema>;

// Postgres INTEGER max; anything larger would raise a DB error instead of a clean 404/400.
const MAX_INT = 2_147_483_647;

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title must be 255 characters or fewer"),
  description: z.string().trim().max(5000, "Description must be 5000 characters or fewer").optional(),
  priority: prioritySchema.default("medium"),
});

// Only status and priority are updatable. `.strict()` rejects any other field
// (title, created_at, ...) instead of silently ignoring it.
export const updateTicketSchema = z
  .object({
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
  })
  .strict()
  .refine((body) => body.status !== undefined || body.priority !== undefined, {
    message: "Provide at least one of: status, priority",
  });

export const listQuerySchema = z.object({
  status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).max(MAX_INT).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().min(1).max(MAX_INT),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
