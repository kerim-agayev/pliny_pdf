import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// We connect via Supabase's TRANSACTION pooler (DATABASE_URL port 6543), which allows
// many short-lived clients — robust against the session pooler's ~15-client cap that
// two dev processes (Next + Elysia) plus HMR re-evals can exhaust ("max clients
// reached"). Transaction mode requires `prepare: false` (PgBouncer can't keep prepared
// statements across pooled connections). We still keep the pool small, let idle
// connections close, and reuse one client across HMR via globalThis.
const globalForDb = globalThis as unknown as {
  __plinyPg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__plinyPg ??
  postgres(connectionString, {
    prepare: false, // Supabase pooler (PgBouncer) doesn't support prepared statements
    max: 5, // both processes together stay well under the pooler's client cap
    idle_timeout: 20, // close idle connections after 20s instead of holding them
    max_lifetime: 60 * 30, // recycle a connection after 30 min
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__plinyPg = client;
}

export const db = drizzle(client, { schema });
