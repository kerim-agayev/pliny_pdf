import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { health } from "./routes/health";

/**
 * PlinyPDF backend (Bun + Elysia). Separate process from Next.js — it owns the
 * heavy / secret work: Gotenberg proxy, Gemini proxy, rate limiting, billing.
 * Runs on :8080 (Gotenberg holds :3001). CORS allows the Next.js origin with
 * credentials so the Better Auth cookie reaches us for session validation.
 */
const PORT = Number(process.env.SERVER_PORT ?? 8080);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const app = new Elysia()
  .use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
  .use(health)
  .listen(PORT);

console.log(`🦅 PlinyPDF backend running at http://localhost:${PORT}`);

export type App = typeof app;
