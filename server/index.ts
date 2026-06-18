import * as Sentry from "@sentry/bun";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { health } from "./routes/health";
import { convert } from "./routes/convert";
import { ocr } from "./routes/ocr";
import { editor } from "./routes/editor";
import { tools } from "./routes/tools";
import { ai } from "./routes/ai";
import { billing } from "./routes/billing";

// Error tracking. No-op when SENTRY_DSN is unset, so local dev is unaffected.
const SENTRY_DSN = process.env.SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: !!SENTRY_DSN, tracesSampleRate: 0.1 });

/**
 * PlinyPDF backend (Bun + Elysia). Separate process from Next.js — it owns the
 * heavy / secret work: Gotenberg proxy, Gemini proxy, rate limiting, billing.
 * Runs on :8080 (Gotenberg holds :3001). CORS allows the Next.js origin with
 * credentials so the Better Auth cookie reaches us for session validation.
 */
const PORT = Number(process.env.SERVER_PORT ?? 8080);
// FRONTEND_ORIGIN may be a comma-separated list (apex + www in prod). Split into
// an array so @elysiajs/cors matches each allowed origin individually — a single
// joined string never matches any request Origin and drops the CORS header.
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = new Elysia()
  // exposeHeaders: let the cross-origin frontend read Content-Disposition so it
  // can use the server-chosen download name (e.g. PDF→JPG returning a .zip).
  .use(cors({ origin: FRONTEND_ORIGINS, credentials: true, exposeHeaders: ["Content-Disposition"] }))
  .onError(({ error, code, set }) => {
    // Log + report real failures (not routine 404s / validation noise) so an
    // uncaught route error is visible in journald instead of a silent raw 500,
    // and return a friendly JSON body instead of Elysia's bare error response.
    if (code !== "NOT_FOUND" && code !== "VALIDATION") {
      console.error(`[onError] ${code}:`, error);
      Sentry.captureException(error);
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "badRequest", message: "Invalid request." };
    }
    if (code !== "NOT_FOUND") {
      set.status = 500;
      return { error: "serverError", message: "Something went wrong. Please try again." };
    }
  })
  .use(health)
  .use(convert)
  .use(ocr)
  .use(editor)
  .use(tools)
  .use(ai)
  .use(billing)
  .listen(PORT);

console.log(`🦅 PlinyPDF backend running at http://localhost:${PORT}`);

export type App = typeof app;
