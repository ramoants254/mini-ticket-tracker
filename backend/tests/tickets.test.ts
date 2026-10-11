import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { pool } from "../src/db/pool";

interface SeedTicket {
  title: string;
  status?: "open" | "in_progress" | "closed";
  priority?: "low" | "medium" | "high";
  minutesAgo?: number;
}

/** Inserts tickets directly with controlled timestamps so ordering is deterministic. */
async function seed(tickets: SeedTicket[]) {
  for (const t of tickets) {
    await pool.query(
      `INSERT INTO tickets (title, status, priority, created_at)
       VALUES ($1, $2, $3, NOW() - ($4 || ' minutes')::interval)`,
      [t.title, t.status ?? "open", t.priority ?? "medium", String(t.minutesAgo ?? 0)],
    );
  }
}

describe("POST /tickets", () => {
  it("creates a ticket and applies defaults", async () => {
    const res = await request(app).post("/tickets").send({ title: "  Printer broken  " });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: "Printer broken", // trimmed
      description: null,
      status: "open",
      priority: "medium",
    });
    expect(new Date(res.body.createdAt).getTime()).not.toBeNaN();

    const { rows } = await pool.query("SELECT title FROM tickets");
    expect(rows).toHaveLength(1); // actually persisted
  });

  it("rejects a missing or blank title with 400 and error details", async () => {
    for (const body of [{}, { title: "   " }]) {
      const res = await request(app).post("/tickets").send(body);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe("Validation failed");
      expect(res.body.error.details[0].path).toBe("title");
    }
    const { rows } = await pool.query("SELECT 1 FROM tickets");
    expect(rows).toHaveLength(0);
  });

  it("rejects an invalid priority", async () => {
    const res = await request(app).post("/tickets").send({ title: "x", priority: "urgent" });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe("priority");
  });
});

describe("GET /tickets/stats", () => {
  it("returns zero counts for every status when there are no tickets", async () => {
    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 0, in_progress: 0, closed: 0 });
  });

  it("counts tickets grouped by status", async () => {
    await seed([
      { title: "a", status: "open" },
      { title: "b", status: "open" },
      { title: "c", status: "closed" },
    ]);

    const res = await request(app).get("/tickets/stats");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ open: 2, in_progress: 0, closed: 1 });
  });
});

describe("GET /tickets", () => {
  it("filters by status and reports the filtered total", async () => {
    await seed([
      { title: "open 1", status: "open" },
      { title: "closed 1", status: "closed" },
      { title: "closed 2", status: "closed" },
    ]);

    const res = await request(app).get("/tickets").query({ status: "closed" });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((t: { status: string }) => t.status === "closed")).toBe(true);
  });

  it("paginates newest first", async () => {
    await seed([
      { title: "oldest", minutesAgo: 50 },
      { title: "older", minutesAgo: 40 },
      { title: "middle", minutesAgo: 30 },
      { title: "newer", minutesAgo: 20 },
      { title: "newest", minutesAgo: 10 },
    ]);

    const page1 = await request(app).get("/tickets").query({ page: 1, limit: 2 });
    const page2 = await request(app).get("/tickets").query({ page: 2, limit: 2 });
    const page3 = await request(app).get("/tickets").query({ page: 3, limit: 2 });

    expect(page1.body).toMatchObject({ page: 1, limit: 2, total: 5 });
    expect(page1.body.data.map((t: { title: string }) => t.title)).toEqual(["newest", "newer"]);
    expect(page2.body.data.map((t: { title: string }) => t.title)).toEqual(["middle", "older"]);
    expect(page3.body.data.map((t: { title: string }) => t.title)).toEqual(["oldest"]);
  });

  it("rejects invalid query params with 400", async () => {
    for (const query of [{ status: "bogus" }, { page: 0 }, { limit: 1000 }, { page: "abc" }]) {
      const res = await request(app).get("/tickets").query(query);
      expect(res.status).toBe(400);
    }
  });
});

describe("PATCH /tickets/:id", () => {
  it("updates status and priority and persists the change", async () => {
    const created = await request(app).post("/tickets").send({ title: "Login bug" });

    const res = await request(app)
      .patch(`/tickets/${created.body.id}`)
      .send({ status: "in_progress", priority: "high" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: "Login bug", status: "in_progress", priority: "high" });

    const { rows } = await pool.query("SELECT status, priority FROM tickets WHERE id = $1", [created.body.id]);
    expect(rows[0]).toEqual({ status: "in_progress", priority: "high" });
  });

  it("changes only the field that was sent", async () => {
    const created = await request(app).post("/tickets").send({ title: "x", priority: "low" });

    const res = await request(app).patch(`/tickets/${created.body.id}`).send({ status: "closed" });

    expect(res.body).toMatchObject({ status: "closed", priority: "low" });
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).patch("/tickets/999999").send({ status: "closed" });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it("rejects empty bodies, unknown fields, and non-numeric ids with 400", async () => {
    const created = await request(app).post("/tickets").send({ title: "x" });
    const url = `/tickets/${created.body.id}`;

    expect((await request(app).patch(url).send({})).status).toBe(400);
    expect((await request(app).patch(url).send({ title: "hacked" })).status).toBe(400);
    expect((await request(app).patch(url).send({ status: "nope" })).status).toBe(400);
    expect((await request(app).patch("/tickets/abc").send({ status: "closed" })).status).toBe(400);
  });
});
