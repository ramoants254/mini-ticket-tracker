import cors from "cors";
import express from "express";
import { config } from "./config";
import { pool } from "./db/pool";
import { ticketsRouter } from "./routes/tickets";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// The app is exported separately from server.ts so tests (Supertest)
// can import it without opening a network port.
export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.use("/tickets", ticketsRouter);

// Must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);
