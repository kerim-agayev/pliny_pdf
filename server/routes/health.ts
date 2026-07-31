import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const health = new Elysia().get("/api/health", async ({ set }) => {
  try {
    await db.execute(sql`select 1`);
    return { ok: true, service: "plinypdf-backend", db: "up" };
  } catch (err) {
    // Surfaces Supabase auto-pause (or any DB outage) here instead of only when a user hits login/dashboard.
    set.status = 503;
    return {
      ok: false,
      service: "plinypdf-backend",
      db: "down",
      error: err instanceof Error ? err.message : String(err),
    };
  }
});
