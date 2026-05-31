import { defineConfig } from "drizzle-kit";

// DATABASE_URL is provided by the `bun run scripts/db.ts` wrapper, which forwards
// Bun's loaded .env.local environment to drizzle-kit (see scripts/db.ts).
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Use `bun run db:push` / `bun run db:generate`.");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
