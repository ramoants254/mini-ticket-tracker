import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// Every error leaves the API in this one shape:
// { "error": { "message": string, "details"?: [{ "path": string, "message": string }] } }

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  // Malformed JSON body (thrown by express.json()).
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Request body is not valid JSON" } });
    return;
  }

  // Unknown error: log it, but never leak internals to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({ error: { message: "Internal server error" } });
};
